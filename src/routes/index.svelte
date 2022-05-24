<script lang="ts">
	import pretty from 'pretty-bytes';
	import type { Counter } from '$lib/models/Counters';
	import IndexPageCard from '$lib/components/IndexPageCard.svelte';
	export let counters: Counter;
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<div class="hero min-h-screen bg-base-200 bg-opacity-25">
	<div class="hero-content text-center flex-col">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold">Filehost</h1>
		</div>
		<div class="flex flex-row py-6 w-full flex-wrap justify-center">
			<IndexPageCard title="Unique visits">{counters.uniqueviews}</IndexPageCard>
			<IndexPageCard title="Uploads">{counters.uploads}</IndexPageCard>
			<IndexPageCard title="Storage"
				>{pretty(counters.uploadsize * 1000, { bits: false })}</IndexPageCard
			>
		</div>
	</div>
</div>

<div class="container">
	<h2>
		try editing <strong>src/routes/index.svelte</strong>
	</h2>
</div>

<!-- <style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style> -->
