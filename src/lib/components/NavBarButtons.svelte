<script lang="ts">
	import StoreData from '$lib/store/file';
	import { CopyIcon, FileIcon, CodeIcon, DownloadIcon, EyeIcon } from 'svelte-feather-icons';
	import { session, page } from '$app/stores';
	import { modalopen } from './LoginModal.svelte';

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
		<div class="item hover:cursor-pointer">
			<DownloadIcon class="inline-block" size={ICON_SIZE} />
			<a download href={$StoreData.url}>Download</a>
		</div>
	{/if}
</div>
{#if $session.isFuckingGod}
	<a class="item md:ml-auto" href="/dash">Dashboard</a>
{:else if smol}
	<a class="item md:ml-auto" href="/login">Login</a>
{:else}
	<a
		class="item md:ml-auto"
		href="/login"
		class:active={$page.url.pathname == '/login'}
		on:click|preventDefault={() => ($modalopen = true)}>Login</a
	>
{/if}

<style>
	a {
		color: inherit;
		text-decoration: none;
	}
</style>
