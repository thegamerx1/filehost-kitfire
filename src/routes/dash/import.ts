import type { RequestHandler } from '@sveltejs/kit';
export const get: RequestHandler = async ({ locals }) => {
	if (!locals.isFuckingGod) {
		return {
			status: 302,
			headers: {
				Location: '/login'
			}
		};
	}

	return {};
};
