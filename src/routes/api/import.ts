import type { RequestHandler } from '@sveltejs/kit';
import { uploadImport } from '$lib/server/firebase';
import { urlInCaseNoOrigin, SIZELIMIT } from '../../../env';
import { validate } from '$lib/models/Import';
import { getErrorMessage } from '$lib/utils/getError';

function getIP(fileip: string, clientip: string) {
	if (!fileip || fileip === '127.0.0.1' || fileip === '0.0.0.0') {
		return clientip;
	}
	return fileip;
}

export type ImportOutput = Awaited<ReturnType<typeof uploadImport>>;

var runningUploads = 0;
const MAX_RUNNING_UPLOADS = 1;
export const post: RequestHandler = async ({ request, clientAddress, locals }) => {
	while (runningUploads > MAX_RUNNING_UPLOADS) {
		await new Promise((res) => setTimeout(res, 100));
	}
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

	let parsed: ReturnType<typeof validate>;

	try {
		parsed = validate(JSON.parse(json));
	} catch (e) {
		return {
			body: { error: getErrorMessage(e) } as ImportOutput
		};
	}
	let result: ImportOutput;
	try {
		runningUploads++;
		result = await uploadImport(file, {
			...parsed,
			ip: getIP(parsed.ip, clientAddress)
		});
		runningUploads--;
	} catch (e) {
		runningUploads--;
		let message = getErrorMessage(e);
		console.error(e);
		return {
			status: 200,
			body: {
				error: message
			} as ImportOutput
		};
	}

	console.log(
		`imported ${clientAddress} ${result.success ? 'successfully' : 'unsuccessfully'} ${
			result?.data?.name ?? ''
		}`
	);
	let mem = process.memoryUsage();
	for (let key in mem) {
		console.log(`${key} ${Math.round((mem[key] / 1024 / 1024) * 100) / 100} MB`);
	}

	return {
		status: 200,
		body: result
	};
};
