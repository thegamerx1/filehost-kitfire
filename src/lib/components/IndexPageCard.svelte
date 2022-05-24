<script lang="ts">
	export let title: string;
</script>

<div class="card w-96 bg-primary text-primary-content m-5">
	<div class="card-body">
		<h2 class="card-title">{title}</h2>
		<p class="text-xl lg:text-2xl xl:text-3xl"><slot /></p>
	</div>
</div>
