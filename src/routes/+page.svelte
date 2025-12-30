<script>
    import { Button } from "flowbite-svelte";
    import { protocol, HyprWireProtocol, Toast, ProtocolElement, EditElement, sidebarUpdateTrigger, selectedElement } from "$lib";
    import { WandMagicSparklesSolid, BookSolid } from "flowbite-svelte-icons";
	import { onMount } from "svelte";

    $: xmlTextareaText = "";
	let subbedToChanges = false;

    onMount(() => {
        if (!subbedToChanges) {
            protocol.subscribe((proto) => {
                if (proto == null) return;

                xmlTextareaText = HyprWireProtocol.serialize(proto);
            });
        }
    })

    function copyXml() {
        if ($protocol == null) return;
        navigator.clipboard.writeText(HyprWireProtocol.serialize($protocol));

        Toast.fire({
            icon: "success",
            title: "Copied XML"
        });
    }

    function exportXML() {
        if ($protocol == null) return;

        const link = document.createElement("a");
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(HyprWireProtocol.serialize($protocol)));
        link.setAttribute('download', `${$protocol.name}.xml`);

        link.click();
    }

    // @ts-ignore
    function handleElementClick(path) {
        console.log("Selected element", path);
    }

    function selectProtocol() {
        selectedElement.set(null);
    }
</script>

<svelte:head>
    <title>Hyprwire Protocol Editor</title>
</svelte:head>

{ #if $protocol !== null }
    <div class="flex flex-row h-11/12 w-full justify-between">
        <div class="w-4xl h-full overflow-y-scroll overflow-x-scroll transition-all">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl opacity-60 select-none">Elements</h2>
            </div>
            
            <!-- Protocol Settings Button -->
            <Button 
                size="sm" 
                color={$selectedElement === null ? "blue" : "light"}
                class="w-full justify-start text-left mb-3 border-2"
                onclick={selectProtocol}
            >
                <BookSolid size="sm" class="mr-2" />
                <span class="font-semibold">{$protocol.name || 'Protocol'}</span>
                <span class="ml-2 opacity-50 text-xs">v{$protocol.version}</span>
            </Button>
            
            <hr class="text-gray-800 mb-4" />
            
            {#if $sidebarUpdateTrigger}
                {#each $protocol.elements as element}
                    <ProtocolElement {element} onSelect={handleElementClick} />
                {/each}
            {/if}
        </div>
        <div class="w-1 h-full ms-5 bg-slate-800"></div>
        <div class="w-full h-full ms-5 overflow-scroll">
            <EditElement />
        </div>
        <div class="w-1 h-full ms-5 bg-slate-800"></div>
        <div class="w-full h-full pl-5">
            <textarea class="xml-textarea jb-font" oninput={e => {
                // @ts-ignore
                const xmlText = e.target.value;
                try {
                    protocol.set(HyprWireProtocol.parse(xmlText));
                }
                catch {
                    console.warn('Cant parse protocol');
                }
            }}>{xmlTextareaText}</textarea>
            <div class="w-full h-1/12 gap-4 flex items-center">
                <Button color="dark" class="w-52" onclick={copyXml}>Copy XML</Button>
                <Button color="cyan" class="w-full" onclick={exportXML}>Export protocol</Button>
            </div>
        </div>
    </div>
{ :else }
    <div class="flex flex-col w-full h-11/12 justify-center items-center opacity-50 gap-5">
        <WandMagicSparklesSolid class="shrink-0 w-20 h-20" />
        <h1 class="text-4xl select-none">Create a new protocol or open the existing one</h1>
    </div>
{ /if }