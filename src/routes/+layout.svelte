<script>
	import './layout.css';
	import "@fontsource/inter";
	import "@fontsource/jetbrains-mono";
	import favicon from '$lib/assets/favicon.png';
	import { Header, protocol } from "$lib";
	import { onMount } from 'svelte';

	let { children } = $props();

	let subbedToChanges = false;

	onMount(() => {
		if (!subbedToChanges) {
			protocol.subscribe((proto) => {
				console.debug("Protocol updated", proto);
			});
			subbedToChanges = true;
		}
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="w-full p-5 h-full">
	<Header />
	<hr class="text-slate-600 my-5" />
	{@render children()}
</div>

