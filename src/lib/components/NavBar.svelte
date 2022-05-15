<script lang="ts">
	import NavBarButtons from './NavBarButtons.svelte';
</script>

<nav class="flex flex-col p-2 border-b-2">
	<div class="flex-row justify-content-center hidden md:flex">
		<NavBarButtons />
	</div>
	<div class="items flex-row flex-1 justify-center flex md:hidden">
		<NavBarButtons smol={true} />
	</div>
</nav>
