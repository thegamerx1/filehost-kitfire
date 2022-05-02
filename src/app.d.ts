/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	interface Locals {
		userid: string;
	}

	interface Platform {}

	interface Session {
		user: { uid: string; name: string; email: string };
		userAgent: string;
		isView: boolean;
		firebaseClientConfig: {
			apiKey: string;
			authDomain: string;
			projectId: string;
			storageBucket: string;
			messagingSenderId: string;
			appId: string;
			measurementId: string;
		};
	}

	interface Stuff {}
}
