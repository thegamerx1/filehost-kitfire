<script lang="ts">
	import Prism from 'prismjs';
	import 'prismjs/components';
	import 'prismjs/themes/prism-okaidia.css';
	import 'prismjs/plugins/autolinker/prism-autolinker.css';
	import 'prismjs/plugins/inline-color/prism-inline-color.css';
	import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
	import 'prismjs/plugins/line-numbers/prism-line-numbers';
	import 'prismjs/plugins/autolinker/prism-autolinker';
	import 'prismjs/plugins/inline-color/prism-inline-color';
	import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';
	import 'prismjs/plugins/autoloader/prism-autoloader';

	import { LoaderIcon } from 'svelte-feather-icons';
	import { browser } from '$app/env';
	import StoreData from '$lib/store/file';
	import { scale } from 'svelte/transition';
	export let url: string;
	export let language: string;

	Prism.manual = true;

	let code = '';
	if (!(language in Prism.languages)) {
		language = 'markup';
	}
	if (browser) {
		fetch(url)
			.then((res) => res.text())
			.then((text) => {
				code = Prism.highlight(text, Prism.languages[language], language);
				$StoreData.code = text;
			})
			.then(() => {
				Prism.highlightAll();
			});
	}
</script>

{#if code}
	<pre in:scale><code class="line-numbers language-{language} text-mono">{@html code}</code></pre>
{:else}
	<div class="h-full w-full flex justify-center items-center text-white">
		<LoaderIcon class="spin" />
	</div>
{/if}

<style>
	pre,
	code {
		margin: 0;
		padding: 0;
		word-wrap: normal;
		overflow-y: auto;
		overflow-x: auto;
		max-height: 100%;
		max-width: 100%;
	}

	code {
		font-size: 1.2rem;
	}

	pre {
		height: 100%;
		width: 100%;
	}
</style>
