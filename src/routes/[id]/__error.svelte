<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = ({ status, error }) => {
		return {
			props: {
				status,
				error: error?.message
			}
		};
	};
</script>

<script lang="ts">
	export let status: number;
	export let error: string;
</script>

<svelte:head>
	<title>{status}</title>
</svelte:head>

<div class="container mt-5 rounded-xl overflow-hidden py-6 flex justify-center self-center">
	<div class="place-self-center text-white">
		{#if status === 404}
			Not found
		{:else}
			{error}
		{/if}
	</div>
</div>
