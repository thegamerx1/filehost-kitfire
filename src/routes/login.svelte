<script context="module" lang="ts">
	export const prerender = false;
	export const hydrate = false;
</script>

<script lang="ts">
	import { form, field } from 'svelte-forms';
	import { required, pattern } from 'svelte-forms/validators';

	const user = field('user', '', [required()]);
	const password = field('password', '', [pattern(/^.{8,}$/)]);
	const myForm = form(user, password);

	function submit() {
		fetch;
	}
</script>

<div class="w-full">
	<!-- svelte-ignore component-name-lowercase -->
	<form class="bg-slate-700 rounded px-8 pt-7 pb-8 mb-4" on:submit|preventDefault={submit}>
		<div class="mb-4">
			<label class="block text-white text-sm font-bold mb-2" for="user"> User </label>
			<input
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				id="user"
				type="text"
				placeholder="Username"
				bind:value={$user.value}
			/>
		</div>
		<div class="mb-4">
			<label class="block text-white text-sm font-bold mb-2" for="password"> Password </label>
			<input
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
				id="password"
				type="password"
				placeholder="******************"
				bind:value={$password.value}
			/>
		</div>
		{#each $myForm.errors as error}
			<p class="text-red-500 text-xl italic my-5">Invalid {error}</p>
		{/each}
		<div class="flex items-center justify-between">
			<button
				class="bg-blue-500  w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="button"
				disabled={!$myForm.valid}
			>
				Login
			</button>
		</div>
	</form>
</div>

<svelte:head>
	<title>Upload</title>
</svelte:head>
