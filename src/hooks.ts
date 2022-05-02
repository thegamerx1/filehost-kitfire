import type { Handle } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit/types/private';
import * as cookie from 'cookie';
import type { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { decodeToken } from '$lib/server/firebase';
import { FIREBASE_CLIENT_CONFIG as firebaseClientConfig } from '$lib/server/constants';

interface Session {
	firebaseClientConfig: typeof firebaseClientConfig;
	userAgent: string | null;
	isView: boolean;
	user?: {
		name: string;
		email?: string;
		uid: string;
	};
}

export async function getSession(event: RequestEvent): Promise<Session> {
	const locals: any = event.locals;
	const decodedToken: DecodedIdToken | null = locals.decodedToken;

	if (decodedToken) {
		const { uid, name, email } = decodedToken;

		return {
			userAgent: event.request.headers.get('user-agent'),
			isView: event.request.url.includes('?view='),
			user: { name, email, uid },
			firebaseClientConfig
		};
	} else {
		return {
			userAgent: event.request.headers.get('user-agent'),
			isView: event.request.url.includes('?view='),
			user: undefined,
			firebaseClientConfig
		};
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const locals: any = event.locals;
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');
	locals.decodedToken = await decodeToken(cookies.token);
	// if (!locals.decodedToken && !publicPages.includes(event.url.pathname)) {
	// 	// If you are not logged in and you are not on a public page,
	// 	// it just redirects you to the main page, which is / in this case.
	// 	event.request.headers.append('Location', '/');
	// 	event.request.headers.append('status', '302');
	// 	return await resolve(event);
	// }

	const response = await resolve(event);

	return response;
};
