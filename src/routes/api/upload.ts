import type { RequestHandler } from '@sveltejs/kit';
import { uploadFile, uploadTokenValid } from '$lib/server/firebase';
import { urlInCaseNoOrigin, SIZELIMIT } from '../../../env';

export const post: RequestHandler = async ({ request, clientAddress }) => {
	const data = await request.formData();
	const file = data.get('file') as File;
	const destruct = data.get('destruct')?.toString() || '';
	const webpify = data.get('webpify') === 'true';
	const tag = data.get('tag')?.toString() || '';
	if (!file) {
		return {
			status: 400,
			body: 'No file was provided'
		};
	}

	if (file.size / 1024 ** 2 > SIZELIMIT) {
		return {
			status: 413,
			body: `File is too large. Max size is ${SIZELIMIT}MB`
		};
	}

	const user = await uploadTokenValid(data.get('secret') as string);
	if (!user) {
		await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 100)));
		return {
			status: 403,
			body: 'Invalid secret'
		};
	}

	let result: Awaited<ReturnType<typeof uploadFile>>;
	try {
		result = await uploadFile(file, clientAddress, destruct, webpify, tag, user.name);
	} catch (e) {
		let message = 'An error occurred while uploading the file';
		if (typeof e === 'string') {
			message = e.toUpperCase();
		} else if (e instanceof Error) {
			message = e.message;
		}
		console.error(e);
		return {
			status: 400,
			body: message
		};
	}

	const url = request.headers.get('Origin') ?? urlInCaseNoOrigin + '/';
	console.log(`${user.name} uploaded ${result.id}`);

	return {
		status: 200,
		body: {
			name: result.name,
			urls: {
				zws: url + result.zws,
				normal: url + (result.selfDestruct ? '💣' : '') + result.id,
				tries: result.tries,
				delete: url + 'login'
			}
		}
	};
};
