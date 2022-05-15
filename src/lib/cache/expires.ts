import nodecache from 'node-cache';
import admin from 'firebase-admin';
const cache = new nodecache();

import type { Expire } from '$lib/models/Expire';

const CHECK_INTERVAL = 1000 * 60;
let expireSet = false;

export function get(id: string): Expire | undefined {
	if (!id) return;
	return cache.get<Expire>(id);
}

export function set(id: string, data: Expire) {
	cache.set(id, data);
}

export async function setServer(data: Expire, doc: admin.firestore.DocumentReference) {
	await doc.update({
		expires: admin.firestore.FieldValue.arrayUnion(data)
	});
	set(data.id, data);
}

export function onExpire(callback: (data: Expire) => Promise<boolean>) {
	if (expireSet) throw new Error('onExpire already set');
	expireSet = true;
	setInterval(async () => {
		let keys = cache.keys();
		for (let key of keys) {
			let data = cache.get<Expire>(key);
			if (data && new Date(data.time).getTime() < Date.now()) {
				let success = await callback(data);
				if (success) {
					cache.del(key);
				}
			}
		}
	}, CHECK_INTERVAL);
}
