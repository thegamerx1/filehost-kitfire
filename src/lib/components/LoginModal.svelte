<script lang="ts" context="module">
	import { writable } from 'svelte/store';
	import { XIcon } from 'svelte-feather-icons';

	export const modalopen = writable(false);
</script>

<script lang="ts">
	import LoginForm from './LoginForm.svelte';
	import { scale } from 'svelte/transition';
</script>

<!-- Main modal -->
{#if $modalopen}
	<div
		class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 bottom-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full bg-slate-800 bg-opacity-75"
		transition:scale
	>
		<div class="relative p-4 w-full max-w-md h-full md:h-auto">
			<!-- Modal content -->
			<div class="relative rounded-lg shadow bg-gray-700">
				<button
					type="button"
					class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
					on:click={() => ($modalopen = false)}
				>
					<XIcon />
				</button>
				<div class="py-6 px-6 lg:px-8">
					<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Login</h3>
					<LoginForm on:success={() => ($modalopen = false)} />
				</div>
			</div>
		</div>
	</div>
{/if}
