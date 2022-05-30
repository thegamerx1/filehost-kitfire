import {
	FIREBASE_SERVER_CONFIG as serviceAccount,
	FIREBASE_CLIENT_CONFIG as clientConfig
} from './constants';
import type { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import admin from 'firebase-admin';
import { v4 as uuid } from '@lukeed/uuid/secure';
import { processUpload, generate, ZWS, saveToBucket, parseDestruct } from './uploadUtils';
import {
	set as setExpire,
	get as getExpire,
	setServer as setExpireFire,
	onExpire,
	expireSetError
} from '$lib/cache/expires';
import {
	set as setCounter,
	setAll as setFireCounter,
	get as getCounter
} from '$lib/cache/counters';

import type { View } from '$lib/models/View';
import { validate as CounterValidate, type Counter } from '$lib/models/Counters';
import * as userCache from '$lib/cache/users';
import { validate as FileValidate } from '$lib/models/File';
import { validate as UserValidate, type User } from '$lib/models/User';
import type { ImportFile } from '$lib/models/Import';
import { validate as ImportValidate } from '$lib/models/Import';
import { validate as ExpireValidate, type Expire } from '$lib/models/Expire';
import type { Bucket } from '@google-cloud/storage';

var DB: admin.firestore.Firestore;
var BUCKET: Bucket;
var EXPIRES: admin.firestore.DocumentReference;
var COUNTERS: admin.firestore.DocumentSnapshot;
var FILES: admin.firestore.CollectionReference;
var USERS: admin.firestore.CollectionReference;
var ISREADY = false;
var _isReadying = false;

async function READY() {
	if (ISREADY) return;
	if (_isReadying)
		await new Promise((r) =>
			setTimeout(async () => {
				await READY();
				r(null);
			}, 1000)
		);
	_isReadying = true;
	console.log(admin.apps.length);
	if (admin.apps.length === 0) {
		console.log('Intializing Firebase');
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount as any),
			databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
		});
	}

	DB = admin.firestore();
	DB.settings({ ignoreUndefinedProperties: true });
	let promises: Promise<any>[] = [];
	promises.push(
		...[
			DB.collection('counter')
				.doc('counters')
				.get()
				.then((doc) => {
					if (!doc.exists) {
						return doc.ref.set(CounterValidate({}));
					}
				}),
			DB.collection('counter')
				.doc('expires')
				.get()
				.then((doc) => {
					if (doc.exists) {
						let data = doc.data();
						if (!data) {
							throw new Error('Typescript thinks this can be empty lol?');
						}
						console.log(`Loading Expires (${data.expires.length})`);
						for (let [index, item] of data.expires.entries()) {
							let parsed: Expire;
							try {
								parsed = ExpireValidate(item);
							} catch (e) {
								console.error('Invalid expire on index: ' + index);
								continue;
							}
							setExpire(parsed.id, parsed);
						}
					} else {
						DB.collection('counter').doc('expires').set({ expires: [] });
					}
					console.log(`Loaded Expires`);
				}),
			DB.collection('users')
				.get()
				.then((snapshot) => {
					userCache.setAll(
						snapshot.docs
							.map((doc) => {
								try {
									return UserValidate(doc.data());
								} catch (e) {
									return null;
								}
							})
							.filter((user): user is User => !!user)
					);
					console.log('Loaded users');
				})
		]
	);
	Promise.allSettled(promises).then(async () => {
		BUCKET = admin.storage().bucket(clientConfig.storageBucket);
		EXPIRES = DB.collection('counter').doc('expires');
		COUNTERS = await DB.collection('counter').doc('counters').get();
		FILES = DB.collection('files');
		USERS = DB.collection('users');

		setFireCounter(COUNTERS);

		console.log('All done firebase ready');
		try {
			onExpire(async (expire) => {
				let file = await FILES.where('id', '==', expire.id).get();
				if (file.empty) {
					console.error(`${expire.id} deleted but expired?? this shouldnt happen on production`);
					await EXPIRES.update({
						expires: admin.firestore.FieldValue.arrayRemove(expire)
					});
					return true;
				}
				let data = file.docs[0].data();
				let parsed = FileValidate(data);
				// if (parsed.id !== expire.id) {
				// ^^ wtf copilot why whould this possibly be wrong

				const batch = DB.batch();
				await BUCKET.file(parsed.file.name).makePrivate();
				batch.update(file.docs[0].ref, { expired: true });
				batch.update(EXPIRES, { expires: admin.firestore.FieldValue.arrayRemove(expire) });

				try {
					await batch.commit();
				} catch (e) {
					console.error(e);
					console.error('failed to expire ' + expire.id);
					return false;
				}

				console.log('Expired file: ' + expire.id);
				return true;
			});
		} catch (e) {
			if (e === expireSetError) {
				return;
			}
			throw e;
		}
		ISREADY = true;
	});
}
READY();

export async function getCounters() {
	return getCounter();
}

export { setCounter as updateCounter };

export async function decodeToken(token: string): Promise<DecodedIdToken | null> {
	if (!token || token === 'null' || token === 'undefined') return null;
	try {
		return await admin.auth().verifyIdToken(token);
	} catch (err) {
		return null;
	}
}

export async function uploadTokenValid(token: string) {
	await READY();
	return userCache.tokenValid(token);
}

export function getUsers() {
	READY();
	return userCache.getAll();
}

export async function editUser(user: string, data: { user: string; description: string | null }) {
	let { exists, query } = await userCache.exists(user, USERS);
	if (!exists) throw new Error('User not found');

	const newData = UserValidate({
		description: data.description,
		name: data.user,
		token: uuid()
	});

	query.docs[0].ref.update(newData);
	userCache.set(user, newData);
	return newData;
}

export async function delUser(name: string) {
	let { exists, query } = await userCache.exists(name, USERS);
	if (!exists) throw new Error('User not found');

	userCache.del(name);
	query.docs[0].ref.delete();
}

export async function createUser(name: string, description: string | null) {
	const user = UserValidate({
		name,
		description,
		token: uuid()
	});
	let { exists } = await userCache.exists(name, USERS);
	if (exists) throw new Error('User already exists');

	await USERS.add(user);
	userCache.add(user);
	return user;
}

export async function getFile(id: string, deleted = false) {
	await READY();
	let ids: string[] = [id];
	let zws = ZWS.decode(id);
	if (zws && zws !== id) ids.push(zws);
	console.log(ids);
	let file = await FILES.where('id', 'in', ids).where('deleted', '==', deleted).get();
	console.log(file);
	if (file.empty) {
		return null;
	}
	let ref = file.docs[0].ref;
	let validate = FileValidate(file.docs[0].data());
	if (validate.selfDestruct && validate.destruct && !getExpire(validate.id)) {
		await setExpireFire({ id: validate.id, time: validate.destruct }, EXPIRES);
	}
	return { ref, doc: validate };
}

export async function uploadFile(
	file: File,
	ip: string,
	destruct: string,
	webpify: boolean,
	tag: string,
	uploader: string | null
) {
	await READY();
	let { ext, data, hash, mime, language } = await processUpload(file, webpify);

	if (!destruct) {
		let exists = await FILES.where('hash', '==', hash)
			.where('deleted', '==', false)
			.where('selfDestruct', '==', false)
			.get();
		if (!exists.empty) {
			let data = FileValidate(exists.docs[0].data());
			return {
				...data,
				zws: ZWS.encode(data.id),
				tries: null
			};
		}
	}

	let { name, id, zws, tries } = await generate(FILES, ext);
	let destroy: string | null = null;
	if (destruct) {
		destroy = parseDestruct(destruct).toISOString();
		id = '💣' + id;
		name = '💣' + name;
	}
	let storeData = {
		name,
		id,
		time: new Date().toISOString(),
		original: file.name,
		mime,
		language,
		destruct: destroy,
		selfDestruct: !!destroy,
		ip,
		tag,
		uploader,
		hash,
		ext,
		tries: {
			database: tries
		},
		views: undefined
	};
	const { validated } = await upload(storeData, data, BUCKET);

	return { ...validated, zws, tries };
}

export async function uploadImport(file: File, filedata: ImportFile) {
	await READY();
	let { ext, data, hash, mime, language } = await processUpload(file, false);
	if (!filedata.destruct) {
		let exists = await FILES.where('hash', '==', hash)
			.where('deleted', '==', false)
			.where('selfDestruct', '==', false)
			.get();
		if (!exists.empty) {
			let data = FileValidate(exists.docs[0].data());
			if (data.hash !== hash) {
				return {
					error: `File with different hash exists ${data.name}`
				};
			}
			return {
				success: true,
				data
			};
		}
	}

	let storeData = {
		name: filedata.name,
		id: filedata.id,
		time: filedata.time,
		original: filedata.original,
		mime,
		language,
		destruct: filedata.destruct,
		selfDestruct: filedata.selfDestruct,
		ip: filedata.ip,
		uploader: 'importer',
		hash,
		ext,
		tag: null,
		tries: null,
		views: filedata.views
	};
	const { validated } = await upload(storeData, data, BUCKET);

	return {
		success: true,
		data: validated
	};
}

async function upload(
	data: {
		name: string;
		id: string;
		time: string;
		original: string | null | undefined;
		mime: string;
		language: string | undefined;
		destruct: string | null | undefined;
		selfDestruct: boolean;
		ip: string;
		tag: string | undefined | null;
		uploader: string | undefined | null;
		hash: string;
		ext: string | undefined;
		tries:
			| {
					database: number;
			  }
			| null
			| undefined;
		views: View[] | undefined;
	},
	file: Buffer,
	bucket: Bucket
) {
	let { url, fileName, tries: bucketTries } = await saveToBucket(bucket, file, data.mime, data.ext);

	let validated = await FileValidate({
		...data,
		bytes: file.length,
		tries: {
			database: data?.tries?.database || 0,
			bucket: bucketTries
		},
		file: {
			name: fileName,
			url
		}
	});
	let ref: admin.firestore.DocumentReference;
	try {
		ref = await FILES.add(validated);
		if (data.selfDestruct) {
			await setExpireFire({ id: validated.id, time: data.destruct as string }, EXPIRES);
		}
		await setCounter({
			sizeOnKBit: validated.bytes / 1000,
			addupload: true,
			views: validated.views.length
		});
	} catch (e) {
		console.error(e);
		try {
			await BUCKET.file(fileName).delete();
		} catch (err) {
			console.error(err);
			console.error('Le bruh how this happen');
		}
		throw e;
	}

	return { ref, validated };
}
