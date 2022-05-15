<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	let visible = writable('');
</script>

<script lang="ts">
	import { EyeIcon, EyeOffIcon, EditIcon, TrashIcon, XIcon } from 'svelte-feather-icons';
	import EditUser from './EditUser.svelte';
	import { scale, blur } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let token: string = '',
		description: string | null = '',
		name: string = '',
		edit = false,
		isAdd = false;
	let thisvisible = false;
	let delete1 = false;

	function del() {
		fetch('/dash/user', {
			method: 'DELETE',
			body: JSON.stringify({ user: name }),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.users) {
					dispatch('update', res.users);
				}
			})
			.catch((e) => console.log(e));
	}

	$: thisvisible = $visible === name;

	function transitionHelper(transitionLifeCycle: string, duration: number) {
		return transitionLifeCycle === 'in'
			? { duration, delay: duration * 2 }
			: { duration, delay: 0 };
	}
</script>

<div
	class="container m-2 p-6 w-64 bg-gray-700 border-2 border-gray-400"
	in:scale={transitionHelper('in', 100)}
	out:scale={transitionHelper('out', 200)}
>
	{#if edit}
		<EditUser
			on:update={(e) => {
				if (name) {
					edit = false;
				}
				dispatch('update', e.detail);
			}}
			on:cancel={() => (edit = false)}
			{isAdd}
			editUser={name}
			editDescription={description}
		/>
	{:else}
		<div in:scale={{ duration: 200, delay: 450 }} out:scale={{ duration: 450, delay: 0 }}>
			<h2>{name}</h2>
			<p>{description}</p>

			<div class="flex flex-row justify-center mb-2">
				<button on:click={() => (edit = true)} out:blur={{ duration: 300, delay: 300 }}
					><EditIcon /></button
				>
				{#if delete1}
					<button on:click={del} in:blur={{ duration: 300 }}><TrashIcon /></button>
				{:else}
					<button
						on:click={() => {
							delete1 = true;
							setTimeout(() => {
								delete1 = false;
							}, 2000);
						}}><XIcon /></button
					>
				{/if}
			</div>

			<div class="inline-flex">
				<input
					class="border-2 bg-slate-500 w-full text-slate-50  border-gray-400 px-0.5"
					type="text"
					value={thisvisible ? token : '•'.repeat(50)}
					readonly
				/>
				{#if thisvisible}
					<button on:click={() => ($visible = '')}>
						<EyeIcon />
					</button>
				{:else}
					<button on:click={() => ($visible = name)}>
						<EyeOffIcon />
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	button {
		@apply hover:bg-gray-700 hover:text-gray-100 text-gray-300 duration-300 transition-colors;
	}
</style>
