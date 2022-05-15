<script lang="ts">
	import '../app.css';
	import '@fontsource/source-code-pro';

	import { onMount } from 'svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';

	onMount(() => {
		// initializeFirebase($session.firebaseClientConfig);
		return;
	});
</script>

<!-- <svelte:body class:dark={$session.dark} /> -->
<NavBar />
<slot />
<LoginModal />

<!-- <style>
	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 10px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style> -->
