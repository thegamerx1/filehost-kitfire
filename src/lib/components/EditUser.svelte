<script lang="ts">
	import { form, field } from 'svelte-forms';
	import { required } from 'svelte-forms/validators';
	import { createEventDispatcher } from 'svelte';
	import type { FieldOptions } from 'svelte-forms/types';
	import { scale } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	const options: Partial<FieldOptions> = {
		checkOnInit: true,
		validateOnChange: true
	};

	export let isAdd = false;
	export let editUser = '',
		editDescription: string | null = '';

	const user = field('user', editUser, [required()], options);
	const description = field('description', editDescription, [], options);
	const Form = form(user, description);

	let error: string = '';
	function submit() {
		let data = {
			user: $user.value,
			description: $description.value
		};
		fetch('dash/user/', {
			method: isAdd ? 'PUT' : 'PATCH',
			body: JSON.stringify(isAdd ? data : { user: editUser, data }),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.users) {
					dispatch('update', res.users);
				} else {
					error = res.error;
				}
			})
			.catch((e) => (error = e));
	}

	function transitionHelper(transitionLifeCycle: string, duration: number) {
		return transitionLifeCycle === 'in'
			? { duration, delay: duration * 2 }
			: { duration, delay: 0 };
	}
</script>

<div in:scale={{ duration: 200, delay: 450 }} out:scale={{ duration: 450, delay: 0 }}>
	<!-- svelte-ignore component-name-lowercase -->
	<form class="bg-gray-700 py-2 px-2" on:submit|preventDefault={submit}>
		<div class="mb-4">
			<label class="block text-sm mb-2 font-medium text-gray-300" for="user"> User </label>
			<input
				class="border-2 bg-slate-500 text-slate-50  w-full border-gray-400 px-0.5"
				id="user"
				type="text"
				placeholder="Username"
				autocomplete="off"
				bind:value={$user.value}
			/>
			{#if $user.errors[0]}
				<p class="text-red-500 text-xs italic">{$user.errors[0]}</p>
			{/if}
		</div>
		<div class="mb-4">
			<label class="block text-sm mb-2 font-medium text-gray-300" for="description">
				Description
			</label>
			<input
				class="border-2 bg-slate-500 text-slate-50 w-full  border-gray-400 px-0.5"
				id="description"
				type="text"
				bind:value={$description.value}
			/>
			{#if $description.errors[0]}
				<p class="text-red-500 text-xs italic">{$description.errors[0]}</p>
			{/if}
		</div>
		{#if error}
			<p class="text-red-500 bold mb-5">{error}</p>
		{/if}
		<div class="flex items-center justify-between">
			{#if editUser}
				<button
					class="bg-blue-500 hover:bg-blue-700 w-full text-white px-2 focus:outline-none disabled:bg-slate-50  disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
					type="button"
					on:click={() => dispatch('cancel')}
				>
					Cancel
				</button>
			{/if}
			<button
				class="{$Form.valid
					? 'bg-blue-500 hover:bg-blue-700'
					: ''} w-full text-white px-2 focus:outline-none disabled:bg-slate-50  disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
				type="submit"
				disabled={!$Form.valid}
			>
				Save
			</button>
		</div>
	</form>
</div>
