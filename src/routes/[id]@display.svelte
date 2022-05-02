<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { getFile } from '$lib/server/firebase';

	export const hydrate = false;
	export const prerender = false;

	type ResponseData = {
		name: string;
		isAudio: boolean;
		isVideo: boolean;
		isImage: boolean;
		isMedia: boolean;
		language: string | null;
		bytes: number;
		url?: string;
		code?: string;
		host: string;
		expired: boolean;
	};

	export const load: Load = async ({ session, params, url }) => {
		let error;
		let doc = await getFile(params.id).catch((e) => {
			console.error(e);
			error = e;
		});
		if (!doc || error) {
			return {
				props: {
					failed: true,
					error: error
				}
			};
		}

		let isAudio = doc.mime.startsWith('audio/');
		let isVideo = doc.mime.startsWith('video/');
		let isImage = doc.mime.startsWith('image/');

		let isMedia = isAudio || isVideo || isImage;

		let code;
		if (doc.language) {
			code = await fetch(doc.file.url)
				.then((res) => res.text())
				.catch(() => undefined);
		}

		let expired = false;
		let now = Date.now();
		let created = new Date(doc.time);
		if (doc.selfDestruct) {
			expired = now > new Date(doc.destruct ?? '').getTime();
		}

		if (created.getTime() > now + 1000 * 60 * 60 * 24 * 365) {
			expired = true;
		}

		let data: ResponseData = {
			name: doc.name,
			isAudio,
			isVideo,
			isImage,
			isMedia,
			bytes: doc.bytes,
			url: code ? undefined : doc.file.url,
			code,
			host: url.origin,
			expired,
			language: doc.language
		};

		return {
			props: {
				data
			}
		};
	};
</script>

<script lang="ts">
	import { FileIcon, EyeIcon, DownloadIcon } from 'svelte-feather-icons';

	export let data: ResponseData;
	export let failed: boolean;
	export let error: unknown;
</script>

<svelte:head>
	<title>{failed ? 'Not found' : data.name}</title>
	<meta property="og:title" content="View" />
	<meta property="og:type" content="website" />

	{#if data.isImage}
		<meta property="og:image" content={data.host + '/i/' + data.name} />
	{:else if data.isVideo}
		<meta property="og:video" content={data.host + '/i/' + data.name} />
	{:else if data.isAudio}
		<meta property="og:audio" content={data.host + '/i/' + data.name} />
	{/if}
	<meta property="og:url" content={data.host + '/' + data.name} />
	<meta
		property="og:description"
		content={!data.isMedia && !data.language && !data.expired
			? `Download ${data.bytes} file`
			: data.language
			? `${data.code?.split('\n').length} lines of ${data.language} code`
			: data.expired
			? 'Expired please contact sender for request'
			: 'Image'}
	/>
</svelte:head>

{#if failed}
	{error}
{:else if data.expired}
	expired lol
{:else}
	<nav class="bg-white border-gray-200 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-800">
		<div class="container flex flex-wrap justify-between items-center mx-auto">
			<div class="hidden w-full md:block md:w-auto" id="mobile-menu">
				<ul class="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium">
					<li>
						<i class="far fa-save" />
						span= size .toolbar-item
						<a
							href="#"
							class="block py-2 pr-4 pl-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white"
							aria-current="page">Home</a
						>
					</li>
					<li>
						<a
							href="#"
							class="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
							>About</a
						>
					</li>
					<li>
						<a
							href="#"
							class="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
							>Services</a
						>
					</li>
					<li>
						<a
							href="#"
							class="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
							>Pricing</a
						>
					</li>
					<li>
						<a
							href="#"
							class="block py-2 pr-4 pl-3 text-gray-700 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
							>Contact</a
						>
					</li>
				</ul>
			</div>
		</div>
	</nav>
	<i class="fas fa-eye" />
	span= views if language .toolbar-item
	<i class="fas fa-language" />
	span= language //- div(class="toolbar-item ml-auto", onclick="delete()") //-
	<i class="fas fa-trash-alt" />
	//- span Delete div(class="toolbar-item ml-auto", onclick="delete()")
	<i class="fas fa-download" />
	a(href=host+name+"?view=true", download=name) Download div.d-flex.justify-content-center.align-items-center.flex-fill.overflow-auto
	{#if data.language}
		include includes/code.pug if mime.startsWith('image/')
	{:else if data.isImage}
		<img src={data.url} alt="content" />
	{:else if data.isVideo}
		<video src={data.url} controls autoplay class="h-full w-full">
			Your browser does not support the video tag.
			<track kind="captions" />
		</video>
	{:else if data.isAudio}
		<audio src={data.url} controls autoplay>Can't display file.</audio>
	{/if}
	{JSON.stringify(data)}
{/if}
