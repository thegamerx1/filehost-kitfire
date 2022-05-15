<script lang="ts">
	let files: FileList;
	let webpify: boolean;

	function submit() {
		let file = files[0];
		let form = new FormData();
		console.log(file);
		form.append('file', file);
		form.append('webpify', webpify ? 'true' : 'false');
		fetch('/api/upload', {
			method: 'POST',
			body: form
		})
			.then((res) => res.json())
			.then((res) => {
				console.log(res);
			})
			.catch((e) => console.error(e));
	}
</script>

<div class="w-full">
	<!-- svelte-ignore component-name-lowercase -->
	<form class="bg-slate-700 rounded px-8 pt-7 pb-8 mb-4" on:submit|preventDefault={submit}>
		<div class="mb-4">
			<label class="block text-white text-sm font-bold mb-2" for="file">File</label>
			<input
				class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				id="File"
				type="file"
				bind:files
				on:change={() => console.log(files)}
			/>
			{#if files && files[0]}
				<p>{files[0].name}</p>
			{/if}
		</div>
		<div class="mb-4">
			<input type="checkbox" id="checkbox" bind:checked={webpify} />
			<label class="block text-white text-sm font-bold mb-2" for="checkbox">Webpify</label>
		</div>
		<div class="flex items-center justify-between">
			<button
				class="bg-blue-500 disabled:bg-blue-700  w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				type="submit"
				disabled={!files || !files[0].name}
			>
				Upload
			</button>
		</div>
	</form>
</div>

<svelte:head>
	<title>Upload</title>
</svelte:head>
