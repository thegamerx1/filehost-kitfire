import type { RequestHandler } from '@sveltejs/kit';
import { uploadImport } from '$lib/server/firebase';
import { urlInCaseNoOrigin, SIZELIMIT } from '../../../env';
import { validate } from '$lib/models/Import';

function getIP(fileip: string, clientip: string) {
	if (!fileip || fileip === '127.0.0.1' || fileip === '0.0.0.0') {
		return clientip;
	}
	return fileip;
}

export const post: RequestHandler = async ({ request, clientAddress, locals }) => {
	if (!locals.isFuckingGod) {
		return {
			status: 403,
			body: {
				error: 'Forbidden'
			}
		};
	}
	const data = await request.formData();
	const file = data.get('file') as File;
	const json = data.get('data')?.toString() || '';
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
	let parsed = validate(JSON.parse(json));

	let result: Awaited<ReturnType<typeof uploadImport>>;
	try {
		result = await uploadImport(file, {
			...parsed,
			ip: getIP(parsed.ip, clientAddress)
		});
	} catch (e) {
		let message = 'An error occurred while uploading the file';
		if (typeof e === 'string') {
			message = e.toUpperCase();
		} else if (e instanceof Error) {
			message = e.message;
		}
		console.error(e);
		return {
			status: 200,
			success: false,
			body: message
		};
	}

	console.log(
		`imported ${clientAddress} ${result.success ? 'successfully' : 'unsuccessfully'} ${
			result?.data?.name ?? ''
		}`
	);

	return {
		status: 200,
		body: result
	};
};
