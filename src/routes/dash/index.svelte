<script lang="ts">
	import User from '$lib/components/User.svelte';
	import { scale } from 'svelte/transition';
	import type { User as UserType } from '$lib/models/User';
	export let users: UserType[];

	import { PlusIcon } from 'svelte-feather-icons';

	let adding = false;

	function update(e: any) {
		console.log(e);
		if (e.detail) {
			users = e.detail;
		}
	}
</script>

<div
	class="h-full container bg-slate-600 text-slate-50 sm:m-5 self-center p-7"
	transition:scale={{ duration: 100 }}
>
	<div class="flex flex-row w-full">
		<h2 class="text-xl">Users</h2>
		<button class="inline-flex ml-auto" on:click={() => (adding = !adding)}><PlusIcon /> Add</button
		>
	</div>
	<div class="flex flex-wrap">
		{#if adding}
			<User
				edit={true}
				isAdd={true}
				on:update={(e) => {
					adding = false;
					update(e);
				}}
			/>
		{/if}
		{#each users as user}
			<User {...user} on:update={update} />
		{/each}
	</div>
</div>
