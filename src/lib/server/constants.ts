import { browser } from '$app/env';
import config from '../../../firebase';

if (browser) {
	// Just in case. I want to know if this file spills into the client ASAP.
	throw Error('Cannot load server constants on the client');
}

export let FIREBASE_CLIENT_CONFIG = config.client;
export let FIREBASE_SERVER_CONFIG = config.server;
