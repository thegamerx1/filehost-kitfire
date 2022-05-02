import type { RequestHandler } from '@sveltejs/kit';
import { uploadFile } from '$lib/server/firebase';

export const post: RequestHandler = async ({ request, clientAddress }) => {
	const data = await request.formData();
	const file = data.get('file') as File;
	const destruct = parseInt(data.get('destruct') as string) || 0;
	const webpify = data.get('webpify') === 'true';
	if (!file) {
		return {
			status: 400,
			body: 'No file was provided'
		};
	}

	let result: Awaited<ReturnType<typeof uploadFile>>;
	try {
		result = await uploadFile(file, clientAddress, destruct, webpify);
		console.log(result);
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

	const url = request.headers.get('Origin') + '/';

	return {
		status: 200,
		body: {
			name: result.name,
			urls: {
				zws: url + result.zws,
				normal: url + result.name,
				tries: result.tries,
				delete: url + 'login'
			}
		}
	};
};
