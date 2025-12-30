<script>
// @ts-nocheck

    import { Button } from "flowbite-svelte";
    import { ChevronDownOutline, ChevronRightOutline } from "flowbite-svelte-icons";
    import { selectedElement, sidebarUpdateTrigger, protocol } from "$lib";
    
    let { element, depth = 0, onSelect } = $props();
    
    let isOpen = $state(true);

    let children = $derived.by(() => {
        if (!element) return [];
        if (element.type === 'enum') return element.values || [];
        if (element.type === 'interface' || element.type === 'object') {
            return [...(element.methods || []), ...(element.requests || []), ...(element.events || [])];
        }
        return element.children || [];
    });

    const hasChildren = $derived(children.length > 0);

    function handleToggle(e) {
        e.stopPropagation();
        isOpen = !isOpen;
    }

    function selectThis() {
        // If has children, just toggle open/close without deselecting
        // if (hasChildren) {
        //     isOpen = !isOpen;
        // }

        onSelect(element.name || element.value || element.type);

        // Always select this element when clicked
        if ($selectedElement != element) {
            selectedElement.set(element);
        }
    }

    function convertToPath(childPath) {
        const currentName = element.name || element.value || element.type;
        return `${currentName} > ${childPath}`;
    }

    function handleChildSelect(childPath) {
        onSelect(convertToPath(childPath));
    }

    let directionText = $derived(($protocol && element.direction == "c2s") ? "→ server" : "client ←");
    let indexText = $derived(($protocol && element.idx != null) ? element.idx : "-");
</script>

{#if $sidebarUpdateTrigger}
<div class="flex flex-col mt-2">
    <div class="flex items-center gap-1 group">
        <div class="w-6 flex justify-center">
            {#if hasChildren}
                <button 
                    type="button"
                    onclick={handleToggle} 
                    class="p-1 hover:bg-gray-700 rounded text-gray-400 focus:outline-none"
                >
                    {#if isOpen}
                        <ChevronDownOutline size="xs" />
                    {:else}
                        <ChevronRightOutline size="xs" />
                    {/if}
                </button>
            {/if}
        </div>
        
        <Button 
            size="xs" 
            color={
                isOpen && $selectedElement == element
                    ? "light" 
                    : (element.type == "enum" || element.idx !== undefined ? "orange" : "cyan")
            } 
            class="w-full justify-start text-left py-1.5 border-0"
            onclick={selectThis}
        >
            <span class="opacity-40 mr-2 text-[9px] uppercase font-bold tracking-tighter w-12">
                {element.type || (element.idx !== undefined ? 'value' : 'method')}
            </span>
            <span class="truncate">
                {element.name || element.value || '(no name)'}
                {#if element.idx !== undefined}
                    <span class="ml-3 opacity-50">
                        { indexText }
                    </span>
                {/if}
                {#if element.direction !== undefined}
                    <span class="ml-3 opacity-50">
                        { directionText }
                    </span>
                {/if}
            </span>
        </Button>
    </div>

    {#if hasChildren && isOpen && $sidebarUpdateTrigger}
        <div class="border-l border-gray-700 ml-3">
            {#each children as child (child.name || child.value || child.idx || child.direction)}
                <!-- svelte-ignore svelte_self_deprecated -->
                <svelte:self 
                    element={child} 
                    depth={depth + 1} 
                    onSelect={handleChildSelect} 
                />
            {/each}
        </div>
    {/if}
</div>
{/if}