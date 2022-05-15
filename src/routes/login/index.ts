import type { RequestHandler } from '@sveltejs/kit';
import { PASSWORD, USER } from '../../../env';
import { v4 as uuid } from '@lukeed/uuid/secure';
import cookie from 'cookie';
import { set, get } from '$lib/cache/session';

export const post: RequestHandler = async ({ clientAddress, request, locals }) => {
	const { user, password } = await request.json();

	if (locals.isFuckingGod) {
		return {
			body: {
				success: true
			}
		};
	}

	if (user !== USER || password !== PASSWORD) {
		console.log(`${clientAddress} - ${user} - Failed Login`);
		return {
			status: 401,
			body: {
				error: 'Invalid credentials'
			}
		};
	}
	console.log(`${clientAddress} - ${user} - Successful Login`);

	const session = uuid();
	set(session, { isAdmin: true });
	return {
		headers: {
			'Set-Cookie': cookie.serialize('session_id', session)
		},
		body: {
			success: true
		}
	};
};
