import { validate } from '$lib/models/Counters';
import type { Counter } from '$lib/models/Counters';
import type admin from 'firebase-admin';
var cache: Counter;
var DOCUMENT_SCHEDULERWOWOWOWOW: admin.firestore.DocumentSnapshot;
export function get(): Counter {
	return cache;
}

export function setAll(doc: admin.firestore.DocumentSnapshot) {
	console.log('Counters initialized');
	cache = validate(doc.data());
	DOCUMENT_SCHEDULERWOWOWOWOW = doc;
}
type COUNTER_FILE = { sizeOnKBit: number; addupload: boolean; views: number };
type COUNTER_VIEW = { uniqueview: true };
type COUNTER_PARAMETER = COUNTER_FILE | COUNTER_VIEW;

function isCounterFile(result: COUNTER_VIEW | COUNTER_FILE): result is COUNTER_FILE {
	return (result as COUNTER_FILE).sizeOnKBit !== undefined;
}

export function set(data: COUNTER_PARAMETER) {
	if (isCounterFile(data)) {
		cache.uploads += data.addupload ? 1 : 0;
		cache.uploadsize += data.sizeOnKBit;
		cache.uniqueviews += data.views;
	} else if (data.uniqueview) {
		cache.uniqueviews += 1;
	}
	scheduleUpdate();
}

let scheduled: NodeJS.Timeout | undefined;
const WAIT_TIME_FOR_UPDAIT = 1000 * 10;
function scheduleUpdate() {
	if (scheduled) {
		clearTimeout(scheduled);
	}
	console.log('Counter scheduled');
	scheduled = setTimeout(async () => {
		console.log('Counter updating');
		await DOCUMENT_SCHEDULERWOWOWOWOW.ref.set(cache);
	}, WAIT_TIME_FOR_UPDAIT);
}
