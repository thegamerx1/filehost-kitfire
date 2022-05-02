import sharp from 'sharp';
import { SECRET, EPOCH } from '../../../env';

import crypto from 'crypto';

import { v4 } from '@lukeed/uuid/secure';
import highlight from 'highlight.js';
import { fileTypeFromBuffer } from 'file-type';
import utf8validate from 'utf-8-validate';
import type { DocumentData } from 'firebase/firestore';
import type { Bucket } from '@google-cloud/storage';

const unallowedMimes = ['image/webp', 'image/svg+xml', 'image/gif'];
async function processUpload(file: File, webpify: boolean) {
	let buffer = Buffer.from(await file.arrayBuffer());
	let type = await fileTypeFromBuffer(buffer);
	let data = buffer,
		ext: string | undefined,
		mime: string;

	if (type) {
		ext = type.ext;
		mime = type.mime;
		if (webpify && type.mime.startsWith('image/') && !unallowedMimes.includes(type.mime)) {
			data = await convertToWebp(buffer);
			ext = 'webp';
			mime = 'image/webp';
		}
	} else {
		ext = file.name.split('.').pop() ?? undefined;
		mime = 'application/octet-stream';
	}

	let hash = hasher(data);

	let language = highlightTest(data);

	return {
		ext,
		data,
		hash,
		mime,
		language
	};
}
function convertToWebp(buffer: Buffer) {
	return sharp(buffer).webp({ lossless: true, quality: 100 }).toBuffer();
}

async function saveToBucket(bucket: Bucket, buffer: Buffer, mime: string, ext?: string) {
	let id: string;
	let name: string;
	let tries = 0;

	while (true) {
		++tries;
		id = v4();
		name = ext ? id + '.' + ext : id;
		let doc = await bucket.file(name).exists();
		if (!doc[0]) break;
	}

	const bFile = bucket.file(name);
	await bFile.save(buffer, {
		contentType: mime
	});

	let expires: Date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
	let whyIsThisAnArray = await bFile.getSignedUrl({
		action: 'read',
		expires
	});

	return {
		url: whyIsThisAnArray[0],
		expires,
		fileName: name,
		tries
	};
}

const LENGTH = 8;
async function generate(col: DocumentData, ext?: string) {
	let id: string;
	let tries = 0;
	while (true) {
		++tries;
		id = generateID(LENGTH + Math.floor(tries / 2));
		let doc = await col.where('id', '==', id).get();
		if (doc.empty) break;
	}
	let zws = ZWS.encode(id);
	if (ZWS.decode(zws) !== id) {
		throw new Error('ZWS encoding failed');
	}

	return {
		zws,
		id,
		name: ext ? id + '.' + ext : id,
		tries
	};
}

const charsID = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('');
function generateID(length: number) {
	let id = '';
	for (let i = 0; i < length; i++) {
		id += charsID[Math.floor(Math.random() * charsID.length)];
	}
	return id;
}

const chars = ['\u200B', '\u200C'];
class ZWS {
	static encode(input: string) {
		const binary = input.split('').map((char) => (char.codePointAt(0) ?? 0 >>> 0).toString(2));
		const paddedBinary = binary.map((bin) => {
			const pad = 8 - bin.length;
			return pad > 0 ? '0'.repeat(pad) + bin : bin;
		});

		return paddedBinary
			.map((bin) => {
				return bin
					.split('')
					.map((bit) => {
						return chars[parseInt(bit)];
					})
					.join('');
			})
			.join('');
	}

	static decode(input: string) {
		if (input.indexOf(chars[0]) === -1) {
			return input;
		}

		const chunks = input.match(/.{1,8}/g) || [];
		const binary = chunks.map((chunk) => {
			return chunk
				.split('')
				.map((char) => {
					return chars.indexOf(char);
				})
				.join('');
		});

		const codePoints = binary.map((bin) => {
			return parseInt(bin, 2);
		});

		return String.fromCodePoint(...codePoints);
	}
}

const epoch = {
	current: () => {
		return Date.now() - EPOCH;
	},
	from: (epoch: number) => {
		return new Date(epoch + EPOCH);
	},
	convert: (time: Date) => {
		return new Date(time.getTime() - EPOCH).getTime();
	}
};

function hasher(data: Buffer) {
	const hash = crypto.createHmac('sha512', SECRET);
	hash.update(data);
	return hash.digest('hex');
}

// 120kb to bytes
const MAX_SCRIPT_SIZE = 120 * 1024;
function highlightTest(buffer: Buffer) {
	let newBuf = buffer;
	if (newBuf.length > MAX_SCRIPT_SIZE || !utf8validate(newBuf)) {
		return;
	}

	let code = newBuf.toString('utf8');
	let highlighted = highlight.highlightAuto(code);
	return highlighted.language;
}

export {
	processUpload,
	ZWS,
	epoch,
	hasher,
	highlightTest,
	// sizes,
	generate,
	saveToBucket
};
