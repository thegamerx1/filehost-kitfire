import nodecache from 'node-cache';

const cache = new nodecache({ stdTTL: 60 * 60 * 24 * 7 });

export function get(id: string): SessionData | undefined {
	if (!id) return;
	let data = cache.get<SessionData>(id);
	return data;
}

export function set(id: string, data: SessionData) {
	cache.set(id, data);
}
