<script lang="ts">
	import { form, field } from 'svelte-forms';
	import { required } from 'svelte-forms/validators';
	import { createEventDispatcher } from 'svelte';
	import type { FieldOptions } from 'svelte-forms/types';

	const dispatch = createEventDispatcher();

	const options: Partial<FieldOptions> = {
		checkOnInit: true,
		validateOnChange: true
	};

	const user = field('user', '', [required()], options);
	const password = field('password', '', [required()], options);
	const Form = form(user, password);

	let error: string = '';
	function submit() {
		fetch('/login', {
			method: 'POST',
			body: JSON.stringify({
				user: $user.value,
				password: $password.value
			}),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					window.location.href = '/dash';
					dispatch('success');
				} else {
					error = res.error;
				}
			})
			.catch((e) => (error = e));
	}
</script>

<!-- svelte-ignore component-name-lowercase -->
<form class="bg-gray-700 py-6 px-6 lg:px-8" on:submit|preventDefault={submit}>
	<div class="mb-4">
		<label class="block text-sm mb-2 font-medium text-gray-300" for="user"> User </label>
		<input
			class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
			id="user"
			type="text"
			placeholder="Username"
			bind:value={$user.value}
		/>
		{#if $user.errors[0]}
			<p class="text-red-500 text-xs italic">{$user.errors[0]}</p>
		{/if}
	</div>
	<div class="mb-4">
		<label class="block text-sm mb-2 font-medium text-gray-300" for="password"> Password </label>
		<input
			class="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-gray-600 border-gray-500 placeholder-gray-400 text-white"
			id="password"
			type="password"
			placeholder="******************"
			autocomplete="current-password"
			bind:value={$password.value}
		/>
		{#if $password.errors[0]}
			<p class="text-red-500 text-xs italic">{$password.errors[0]}</p>
		{/if}
	</div>
	{#if error}
		<p class="text-red-500 bold mb-5">{error}</p>
	{/if}
	<div class="flex items-center justify-between">
		<button
			class="{$Form.valid
				? 'bg-blue-500 hover:bg-blue-700'
				: ''} w-full text-white font-bold py-2 px-4 rounded focus:outline-none disabled:bg-slate-50  disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
			type="submit"
			disabled={!$Form.valid}
		>
			Login
		</button>
	</div>
</form>
