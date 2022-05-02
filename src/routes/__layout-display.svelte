<script context="module" lang="ts">
	import { publicPages } from '$lib/utils/constants';
	export async function load({ url, session }: any) {
		// const thisSession: any = session;
		// if (!thisSession.user && !publicPages.includes(url.pathname)) {
		// 	return { redirect: '/', status: 302 };
		// } else {
		return {};
		// }
	}
</script>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { session } from '$app/stores';
	// import { initializeFirebase } from '$lib/utils/firebase';

	onMount(async () => {
		// initializeFirebase($session.firebaseClientConfig);
	});
</script>

<slot />
<footer>
	<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
</footer>

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 40px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
