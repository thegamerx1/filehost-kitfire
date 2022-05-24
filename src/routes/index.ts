import { getCounters } from '$lib/server/firebase';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async () => {
	let counters = await getCounters();

	return {
		body: {
			counters
		}
	};
};
