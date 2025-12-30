<script>
// @ts-nocheck

	import { Button } from "flowbite-svelte";
    import { FileCirclePlusSolid, FolderSolid } from "flowbite-svelte-icons";
    import fileDialog from "file-dialog";
    import { HyprWireProtocol, protocol, selectedElement } from "$lib";

    function askReset() {
        if ($protocol == null) return true;
        
        return confirm("Do you want to reset everything?");
    }

    function onNew() {
        if (!askReset()) return;

        selectedElement.set(null);

        const proto = HyprWireProtocol.parse('<?xml version="1.0" encoding="UTF-8"?><protocol name="hp_hyprtavern_protocol_v1" version="1"><copyright></copyright><description></description>');
        protocol.set(proto);
    }

    function onImport() {
        if (!askReset()) return;

        fileDialog({
            accept: 'text/xml',
            multiple: false
        })
        .then(files => {
            if (files.length < 0) {
                return;
            }
            const file = files[0];

            const reader = new FileReader();
            reader.addEventListener('load', e => {
                if (e.target == undefined) {
                    console.error("e.target is undefined");
                    return;
                }
                const result = e.target.result;

                if (result == null) {
                    console.error("result is null");
                    return;
                }

                selectedElement.set(null);

                // @ts-ignore
                const proto = HyprWireProtocol.parse(result);
                protocol.set(proto);
            });

            reader.readAsText(file);
        })
    }
</script>

<div class="flex justify-between w-full items-center select-none">
	<h1 class="text-2xl font-bold">
        Hyprwire protocol editor
        <small class="text-sm opacity-50 select-text">{__VERSION__}</small>
    </h1>
	<div class="flex gap-5 items-center">
		<Button color="blue" onclick={onNew}>
            <FileCirclePlusSolid class="shrink-0 h-4 w-4 me-2" />
            New protocol
        </Button>
		<Button color="light" onclick={onImport}>
            <FolderSolid class="shrink-0 h-4 w-4 me-2" />
            Import .xml
        </Button>
	</div>
</div>