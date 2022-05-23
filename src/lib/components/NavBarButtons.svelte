<script lang="ts">
	import StoreData from '$lib/store/file';
	import { FileIcon, CodeIcon, DownloadIcon, EyeIcon } from 'svelte-feather-icons';
	import { session } from '$app/stores';
	const ICON_SIZE = '24em';
	export let smol: boolean = false;

	function setClipboard() {
		if ($StoreData.code) {
			// navigator.clipboard.writeText($StoreData.code);
		}
	}
</script>

<a class="item brand" href="/">FileHost</a>
<div class="flex-1 md:hidden" />
<div class="items flex-row flex-1 justify-center hidden md:flex">
	{#if $StoreData && $StoreData.success == true}
		<div class="item">
			<FileIcon class="inline-block" size={ICON_SIZE} />
			<span>{$StoreData.bytes}</span>
		</div>
		<div class="item">
			<EyeIcon class="inline-block" size={ICON_SIZE} />
			<span>{$StoreData.views}</span>
		</div>
		{#if $StoreData.language}
			<div class="item">
				<CodeIcon class="inline-block" size={ICON_SIZE} />
				<span>{$StoreData.language}</span>
			</div>
			<!-- {#if $StoreData.code}
						<div class="item hover:cursor-pointer">
							<CopyIcon class="inline-block" size={ICON_SIZE} />
							<span on:click={setClipboard}>Copy</span>
						</div>
					{/if} -->
		{/if}
		<a download href={$StoreData.url} class="p-0 m-0">
			<div class="item hover:cursor-pointer">
				<DownloadIcon class="inline-block" size={ICON_SIZE} />
				<span>Download</span>
			</div></a
		>
	{/if}
</div>
{#if $session.isFuckingGod}
	<a class="item md:ml-auto" href="/dash">Dashboard</a>
{:else}
	<a class="item md:ml-auto" href="/login">Login</a>
{/if}

<style>
	a {
		color: inherit;
		text-decoration: none;
	}
</style>
