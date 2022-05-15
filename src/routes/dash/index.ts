import type { RequestHandler } from '@sveltejs/kit';
import { getUsers } from '$lib/server/firebase';
export const get: RequestHandler = async ({ params, url, clientAddress, request, locals }) => {
	if (!locals.isFuckingGod) {
		return {
			status: 302,
			headers: {
				Location: '/login'
			}
		};
	}
	let users = getUsers();

	return {
		body: {
			users
		}
	};
};
