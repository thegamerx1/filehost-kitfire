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
	onExpire
} from '$lib/cache/expires';

import type { User } from '$lib/models/User';
import * as userCache from '$lib/cache/users';
import { validate as FileValidate } from '$lib/models/File';
import { validate as UserValidate } from '$lib/models/User';
import { validate as ExpireValidate, type Expire } from '$lib/models/Expire';
import type { Bucket } from '@google-cloud/storage';

var DB: admin.firestore.Firestore;
var BUCKET: Bucket;
var EXPIRES: admin.firestore.DocumentReference;
var FILES: admin.firestore.CollectionReference;
var USERS: admin.firestore.CollectionReference;

var resolveREADY: (v: any) => void;
var READY = new Promise((resolve) => {
	resolveREADY = resolve;
});

if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount as any),
		databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
	});

	DB = admin.firestore();
	let promises: Promise<any>[] = [];
	promises.push(
		DB.collection('counter')
			.doc('expires')
			.get()
			.then((doc) => {
				if (doc.exists) {
					let data = doc.data();
					if (!data) {
						throw new Error('Typescript thinks this can be empty lol?');
					}
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
			})
	);
	promises.push(
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
			})
	);
	Promise.allSettled(promises).then(() => {
		BUCKET = admin.storage().bucket(clientConfig.storageBucket);
		EXPIRES = DB.collection('counter').doc('expires');
		FILES = DB.collection('files');
		USERS = DB.collection('users');

		onExpire(async (expire) => {
			let file = await FILES.where('id', '==', expire.id).get();
			if (file.empty) {
				console.error(`${expire.id} deleted but expired?? this shouldnt happen`);
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
		resolveREADY(null);
	});
}

export async function decodeToken(token: string): Promise<DecodedIdToken | null> {
	if (!token || token === 'null' || token === 'undefined') return null;
	try {
		return await admin.auth().verifyIdToken(token);
	} catch (err) {
		return null;
	}
}

export async function uploadTokenValid(token: string) {
	await READY;
	return userCache.tokenValid(token);
}

export function getUsers() {
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
	await READY;
	let file = await FILES.where('id', 'in', [id, ZWS.decode(id)])
		.where('deleted', '==', deleted)
		.get();
	if (file.empty) {
		return null;
	}
	let ref = file.docs[0].ref;
	let validate = await FileValidate(file.docs[0].data());
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
	await READY;
	let { ext, data, hash, mime, language } = await processUpload(file, webpify);

	if (!destruct) {
		let exists = await FILES.where('hash', '==', hash)
			.where('deleted', '==', false)
			.where('selfDestruct', '==', false)
			.get();
		if (!exists.empty) {
			let data = await FileValidate(exists.docs[0].data());
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
	}

	let { url, fileName, tries: bucketTries } = await saveToBucket(BUCKET, data, mime, ext);
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
		file: {
			url,
			name: fileName
		},
		hash,
		ext,
		tries: {
			bucket: bucketTries,
			database: tries
		},
		bytes: data.length
	};
	let validated = await FileValidate(storeData);
	let ref: admin.firestore.DocumentReference;
	try {
		ref = await FILES.add(validated);
		if (destroy) {
			await setExpireFire({ id: validated.id, time: destroy }, EXPIRES);
		}
	} catch (e) {
		try {
			await BUCKET.file(fileName).delete();
		} catch (err) {
			console.error(err);
			console.error('Le bruh how this happen');
		}
		throw e;
	}

	return { ...validated, zws, tries };
}
