import type { User } from '$lib/models/User';
import type admin from 'firebase-admin';
const cache: User[] = [];

export function get(name: string): User | undefined {
	if (!name) return;
	let data = cache.find((user) => user.name === name);
	return data;
}

export function add(data: User) {
	cache.push(data);
}

export function setAll(data: User[]) {
	cache.length = 0;
	cache.push(...data);
}

export function getAll() {
	return cache;
}

export function set(name: string, data: User) {
	const item = get(name);
	if (item) {
		const index = cache.indexOf(item);
		cache.splice(index, 1);
	} else {
		throw new Error('User does not exist');
	}
	cache.push(data);
}

export function del(name: string) {
	const item = get(name);
	if (item) {
		const index = cache.indexOf(item);
		cache.splice(index, 1);
	} else {
		throw new Error('User does not exist');
	}
}

export function tokenValid(token: string) {
	return cache.find((user) => user.token === token);
}

export async function exists(name: string, doc: admin.firestore.CollectionReference) {
	let query = await doc.where('name', '==', name).get();

	return {
		exists: !query.empty && cache.find((user) => user.name === name),
		query
	};
}
