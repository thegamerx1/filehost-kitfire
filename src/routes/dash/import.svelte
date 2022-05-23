<script lang="ts">
	let files: FileList;
	import type { ImportFile } from '$lib/models/Import';
	import { validate } from '$lib/models/Import';
	import { getErrorMessage } from '$lib/utils/getError';
	import { writable } from 'svelte/store';

	let errors: string[] = [];
	let running = false;
	let modalOpen = false;
	let parsedData: { data: ImportFile; file: File }[] = [];
	let progressMax = writable(0);
	let progress = writable(0);
	let success = false;
	let uploading = false;
	let finishedUploading = false;
	let uploadsFailed = false;

	async function checkIfRefreshDataIdkHowToCallThis() {
		if (files && files.length > 0 && !running && !modalOpen) {
			running = true;
			modalOpen = true;
			success = false;
			errors = [];
			parsedData = [];

			setTimeout(() => {
				checkValidity().then(() => {
					running = false;
					if (errors.length == 0) {
						success = true;
					}
				});
			}, 1000);
		}
	}

	type LoopIOverIFile = {
		file: File;
		id: string;
	}[];

	function checkForMisses(arr: LoopIOverIFile, arr2: LoopIOverIFile) {
		let missing: string[] = [];

		for (let i of arr) {
			if (!arr2.find((j) => j.id === i.id)) {
				missing.push(i.file.name);
			}
		}

		return missing;
	}

	async function parseArray(files: FileList) {
		let jsons: LoopIOverIFile = [];
		let goodFiles: LoopIOverIFile = [];
		for (let file of Array.from(files)) {
			let splited = file.name.split('.', 3);
			let id = splited.shift();
			if (!id) {
				errors.push(`${file.name} is not a valid file name`);
				continue;
			}

			let path = file.webkitRelativePath;

			if (path.includes('/jsons')) {
				jsons.push({ file, id });
			} else if (path.includes('/files')) {
				goodFiles.push({ file, id });
			} else {
				errors.push(`Relative path is not valid for ${file.name} - ${file.webkitRelativePath}`);
			}
		}
		return { jsons, goodFiles };
	}

	async function checkValidity() {
		let { jsons, goodFiles } = await parseArray(files);

		let misses = [...checkForMisses(jsons, goodFiles), ...checkForMisses(goodFiles, jsons)];
		if (misses.length > 0) {
			errors = [...errors, `The following files are missing:\n${misses.join('\n')}`];
		}

		$progressMax = jsons.length;
		$progress = 0;

		if (errors.length === 0) {
			for (let file of jsons) {
				let text = await file.file.text();
				let data: ImportFile;
				try {
					let json = JSON.parse(text);
					data = validate(json);
				} catch (e) {
					errors = [...errors, file.file.name + ' doesnt have valid schema', getErrorMessage(e)];
					continue;
				}
				parsedData.push({
					data,
					file: goodFiles.find((j) => j.id === file.id)?.file as File
				});
				$progress = $progress + 1;
			}
		}
	}

	const MAX_RUNNING_UPLOADS = 5;
	async function submit() {
		if (!success) {
			return;
		}
		running = true;
		success = false;
		uploading = true;
		$progress = 0;
		let promiseList: Promise<void>[] = [];
		for (let file of parsedData) {
			if (uploadsFailed) return;
			if (promiseList.length > MAX_RUNNING_UPLOADS) {
				await Promise.any(promiseList);
			}
			let form = new FormData();
			form.append('file', file.file);
			form.append('data', JSON.stringify(file.data));

			promiseList.push(
				fetch('/api/import', {
					method: 'POST',
					body: form,
					credentials: 'same-origin',
					headers: {
						Accept: 'application/json'
					}
				})
					.then((res) => (res.status === 200 ? res.json() : { success: false, res }))
					.then(async (res) => {
						$progress = $progress + 1;
						if (!res.success) {
							errors.push(
								res?.error ?? res?.statusText ?? res?.text ? await res.text() : 'Unkown error'
							);
						}
					})
					.catch((e) => {
						errors.push(`Error uploading ${file.data.name}`);
						errors.push(getErrorMessage(e));
						uploadsFailed = true;
					})
			);
		}
		await Promise.all(promiseList);
		if (!uploadsFailed) {
			finishedUploading = true;
		}
		running = false;
	}
</script>

<input type="checkbox" id="my-modal-3" class="modal-toggle" bind:checked={modalOpen} />
<div class="modal antialiased">
	<div class="modal-box relative">
		<button
			class="btn btn-sm btn-circle absolute right-2 top-2"
			on:click={() => (modalOpen = false)}>✕</button
		>
		<ul class="steps steps-vertical lg:steps-horizontal w-full">
			<li class="step step-primary">Check</li>
			<li class="step" class:step-primary={$progressMax}>Validation</li>
			<li class="step" class:step-primary={uploading}>Upload</li>
		</ul>
		{#if !success || (uploading && !finishedUploading && !uploadsFailed)}
			<progress class="progress progress-primary w-full" value={$progress} max={$progressMax} />
		{/if}
		{#if running}
			<button class="btn btn-square loading w-full" />
		{:else if success}
			<h3 class="text-lg font-bold py-2">Files succesfully parsed</h3>
			<p class="py-2">
				You can now upload them to the server, this may take a while please do not close this tab
			</p>
			<button class="btn btn-primary w-full" on:click={submit}> Upload </button>
		{:else if finishedUploading}
			<h3 class="text-lg font-bold py-2">Upload finished</h3>
		{:else if uploadsFailed}
			<h3 class="text-lg font-bold py-2">Uploads failed</h3>
		{/if}
		{#if errors.length > 0}
			<textarea
				readonly
				class="textarea textarea-error resize-none w-full h-72"
				value={errors.join('\n')}
			/>
		{/if}
	</div>
</div>

<div class="card">
	<div class="card-body">
		<!-- svelte-ignore component-name-lowercase -->
		<form class="bg-slate-700 rounded px-8 pt-7 pb-8 mb-4" on:submit|preventDefault={submit}>
			<div class="mb-4 text-white">
				<label class="block text-sm  font-bold mb-2" for="files">Importer output folder</label>
				<input
					class="input rounded py-2 px-3"
					id="files"
					type="file"
					webkitdirectory
					multiple
					bind:files
					on:change={checkIfRefreshDataIdkHowToCallThis}
				/>
			</div>
		</form>
	</div>
</div>

<svelte:head>
	<title>Upload</title>
</svelte:head>
