<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ url, props }) => {
		if (props.data.success && (url.searchParams.has('view') || props.data.hadId)) {
			return {
				status: 302,
				redirect: props.data.url
			};
		}
		return { props };
	};
</script>

<script lang="ts">
	import mediumZoom from 'medium-zoom';
	import CodeContainer from '$lib/components/CodeContainer.svelte';
	import StoreData from '$lib/store/file';
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	export let data: ResponseData;

	if (browser && data.success == true) {
		$StoreData = data;
		if (data.isImage) {
			mediumZoom('#image', {
				scrollOffset: 0,
				background: '#252729'
			});
		}
	}

	let description: string = '';
	if (!data.success) {
		description = data.error;
	} else if (data.language) {
		description = `${data.linesofcode} lines of ${data.language}`;
	}
	onMount(() => {
		return () => {
			$StoreData = { error: 'exit', success: false };
		};
	});
</script>

<svelte:head>
	<title>{data.success ? data.name : data.error}</title>
	<meta property="og:title" content="View" />
	<meta property="og:type" content="website" />

	{#if data.success}
		{#if data.isImage}
			<meta property="og:image" content={data.host + '/' + data.name + '?view=true'} />
			<meta name="twitter:card" content="summary_large_image" />
		{:else if data.isVideo}
			<meta property="og:video" content={data.host + '/' + data.name + '?view=true'} />
		{:else if data.isAudio}
			<meta property="og:audio" content={data.host + '/' + data.name + '?view=true'} />
		{/if}
		<meta property="og:url" content={data.host + '/' + data.name} />
	{/if}
	<meta property="og:description" content={description} />
</svelte:head>

{#if data.success && data.language}
	<div class="h-full w-full overflow-hidden">
		<CodeContainer language={data.language} url={data.url ?? ''} />
	</div>
{:else}
	<div class="container mt-5 rounded-xl overflow-hidden py-6 flex justify-center self-center">
		<div class="place-self-center text-white">
			{#if !data.success}
				{data.error}
			{:else if data.isImage}
				<img
					src={data.url}
					alt="Uploaded file"
					id="image"
					class="object-contain max-w-full height-auto rounded overflow-hidden"
				/>
			{:else if data.isVideo}
				<!-- svelte-ignore a11y-media-has-caption -->
				<video src={data.url} controls autoplay class="h-full w-full" />
			{:else if data.isAudio}
				<audio src={data.url} controls autoplay>Can't display file.</audio>
			{:else}
				{data.name} could not be displayed. Download it to view.
			{/if}
		</div>
	</div>
{/if}
