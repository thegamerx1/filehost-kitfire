import { getFile } from '$lib/server/firebase';
import type { RequestHandler } from '@sveltejs/kit';
import pretty from 'pretty-bytes';
import { createHmac } from 'crypto';
import admin from 'firebase-admin';
import { maxViewsForSameIp, SECRET } from '../../../env';

function hashWithSolt(what: string) {
	return createHmac('sha256', SECRET).update(what).digest('base64');
}

export const get: RequestHandler = async ({ params, url, clientAddress, request }) => {
	let error;
	console.log(typeof clientAddress, clientAddress);
	let out;
	try {
		out = await getFile(params.id.replace('💣', ''));
	} catch (error) {
		return {
			status: 500,
			body: {
				error:
					error instanceof Error
						? error.message
						: typeof error === 'string'
						? error
						: 'Unknown error'
			}
		};
	}
	if (!out || !out.doc) {
		return {
			status: 404,
			body: {
				error
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
			status: 410,
			body: {
				error: 'File expired'
			}
		};
	}

	let ip = hashWithSolt(clientAddress);
	// safe empty user agents are blocked
	let userAgent = hashWithSolt(request.headers.get('user-agent') as string);

	// find how many times ip has viewed file in last 24 hours
	let views = 0;
	let usedUserAgent = false;
	for (let view of doc.views) {
		if (view.ip === ip && new Date(view.time).getTime() > now - 1000 * 60 * 60 * 24) {
			views++;
			if (view.userAgent === userAgent) {
				usedUserAgent = true;
			}
		}
	}

	// result of code below:
	// 	copilot failed a shame

	//optimize the trash above
	// let views = 0;
	// let usedUserAgent = false;
	// let viewsRef = ref.collection('views');
	// let viewsSnap = await viewsRef.where('ip', '==', ip).get();
	// for (let view of viewsSnap.docs) {
	// 	let viewData = view.data();
	// 	if (new Date(viewData.time).getTime() > now - 1000 * 60 * 60 * 24) {
	// 		views++;
	// 		if (viewData.userAgent === userAgent) {
	// 			usedUserAgent = true;
	// 		}
	// 	}
	// }

	if (views <= maxViewsForSameIp && !usedUserAgent) {
		let view = {
			ip,
			time: new Date().toISOString(),
			userAgent
		};

		await ref.update({
			views: admin.firestore.FieldValue.arrayUnion(view)
		});
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
		linesofcode: doc.linesofcode
	};

	return {
		body: { data: data }
	};
};
