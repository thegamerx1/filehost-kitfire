import { getFile, updateCounter } from '$lib/server/firebase';
import type { RequestHandler } from '@sveltejs/kit';
import pretty from 'pretty-bytes';
import { createHmac } from 'crypto';
import admin from 'firebase-admin';
import { maxViewsForSameIp, SECRET } from '../../../env';
import type { View } from '$lib/models/View';
import { getErrorMessage } from '$lib/utils/getError';

function hashWithSolt(what: string) {
	return createHmac('sha256', SECRET).update(what).digest('base64');
}

export const get: RequestHandler = async ({ params, url, clientAddress, request }) => {
	let out;
	let hadId = false;
	try {
		let id = params.id.match(/^(.+?)(\.\w+)?$/);
		if (!id) {
			return {
				status: 404,
				body: {
					data: {
						error: 'File not found',
						success: false
					} as ResponseData
				}
			};
		}
		hadId = !!id[2];
		out = await getFile(id[1]);
	} catch (error) {
		return {
			status: 200,
			body: {
				data: {
					error: getErrorMessage(error, true)
				} as ResponseData
			}
		};
	}
	if (!out || !out.doc) {
		return {
			status: 200,
			body: {
				data: {
					error: 'File not found',
					success: false
				} as ResponseData
			}
		};
	}

	let { ref, doc } = out;

	let isAudio = doc.mime.startsWith('audio/');
	let isVideo = doc.mime.startsWith('video/');
	let isImage = doc.mime.startsWith('image/');

	let isMedia = isAudio || isVideo || isImage;

	let expired = false;
	let now = Date.now();
	let created = new Date(doc.time);
	if (doc.selfDestruct) {
		expired = now > new Date(doc.destruct ?? '').getTime();
	}

	if (created.getTime() > now + 1000 * 60 * 60 * 24 * 365) {
		expired = true;
	}

	if (expired) {
		return {
			body: {
				data: {
					error: 'File expired',
					success: false
				} as ResponseData
			}
		};
	}

	let userAgent = request.headers.get('user-agent') || '';
	if (userAgent) {
		let views = 0;
		let usedUserAgent = false;
		let ip = hashWithSolt(clientAddress);
		userAgent = hashWithSolt(userAgent);

		// find how many times ip has viewed file in last 24 hours
		for (let view of doc.views) {
			if (view.ip === ip && new Date(view.time).getTime() > now - 1000 * 60 * 60 * 24) {
				views++;
				if (view.userAgent === userAgent) {
					usedUserAgent = true;
				}
			}
		}

		if (views <= maxViewsForSameIp && userAgent && !usedUserAgent) {
			let view: View = {
				ip,
				time: new Date().toISOString(),
				userAgent
			};

			await updateCounter({ uniqueview: true });

			await ref.update({
				views: admin.firestore.FieldValue.arrayUnion(view)
			});
		}
	}

	let data: ResponseData = {
		success: true,
		views: doc.views.length,
		name: doc.name,
		isAudio,
		isVideo,
		isImage,
		isMedia,
		bytes: pretty(doc.bytes),
		url: doc.file.url,
		host: url.origin,
		language: doc.language,
		linesofcode: doc.linesofcode,
		hadId
	};

	return {
		body: { data }
	};
};
