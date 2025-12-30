<script>
// @ts-nocheck
import { Input, Label, Helper, Textarea, Button, Select, Toggle } from "flowbite-svelte";
import { selectedElement, HyprWireProtocol, protocol, sidebarUpdateTrigger } from "$lib";
import { ReceiptSolid, PlusOutline, TrashBinSolid, BookSolid } from "flowbite-svelte-icons";
import { tick } from "svelte";
import { 
    createTextInputHandler, 
    createNumberInputHandler, 
    createCheckboxHandler, 
    createSelectHandler,
    ensureDescription 
} from "../form-helpers.js";

// Reactive update to trigger re-render when protocol changes
$: element = $selectedElement;

function updateProtocol() {
    // Force update of selectedElement to trigger reactivity
    selectedElement.set($selectedElement);
    protocol.set({...$protocol});
    sidebarUpdateTrigger.set(false);
    tick();
    sidebarUpdateTrigger.set(true);
    tick();
}

function addArgument() {
    if (!element.args) element.args = [];
    element.args.push({
        name: "new_arg",
        type: "uint",
        summary: ""
    });
    updateProtocol();
}

function removeArgument(index) {
    element.args.splice(index, 1);
    updateProtocol();
}

function addEnumValue() {
    if (!element.values) element.values = [];
    const maxIdx = element.values.reduce((max, v) => Math.max(max, v.idx), -1);
    const newValue = {
        idx: maxIdx + 1,
        name: `new_value_${element.values.length + 1}`,
        description: ""
    };
    element.values = [...element.values, newValue];
    updateProtocol();
}

function removeEnumValue(index) {
    element.values = element.values.filter((_, i) => i !== index);
    updateProtocol();
}

function addMethod() {
    if (!element.methods) element.methods = [];
    element.methods.push({
        name: `new_method_${element.methods.length + 1}`,
        direction: "c2s",
        description: undefined,
        args: [],
        returns: undefined,
        destructor: undefined
    });
    updateProtocol();
}

function removeMethod(index) {
    element.methods.splice(index, 1);
    updateProtocol();
}

function addObject() {
    if (!$protocol.elements) $protocol.elements = [];
    $protocol.elements.push({
        type: "object",
        name: "new_object",
        version: 1,
        description: undefined,
        methods: []
    });
    updateProtocol();
}

function addEnum() {
    if (!$protocol.elements) $protocol.elements = [];
    $protocol.elements.push({
        type: "enum",
        name: "new_enum",
        values: []
    });
    updateProtocol();
}

function deleteCurrentElement() {
    if (!$protocol.elements || !element) return;
    
    const index = $protocol.elements.findIndex(el => el === element);
    if (index !== -1) {
        $protocol.elements.splice(index, 1);
        selectedElement.set(null); // Сбросить выбор после удаления
        updateProtocol();
    }
}

const typeOptions = [
    { value: "uint", name: "uint" },
    { value: "int", name: "int" },
    { value: "varchar", name: "varchar" },
    { value: "fd", name: "fd" },
    { value: "array uint", name: "array uint" },
    { value: "array varchar", name: "array varchar" },
    { value: "enum", name: "enum" }
];

const directionOptions = [
    { value: "c2s", name: "Client → Server (c2s)" },
    { value: "s2c", name: "Server → Client (s2c)" }
];
</script>

{#if !element}
    <div class="flex flex-col w-full h-full overflow-y-auto">
        <div class="flex items-center gap-3 mb-6">
            <BookSolid class="shrink-0 w-8 h-8 text-blue-400" />
            <h1 class="text-2xl font-semibold">Protocol Settings</h1>
        </div>
        
        <div class="flex flex-col gap-4 w-full p-4">
            <!-- Protocol Name -->
            <div class="flex flex-col gap-2">
                <Label>Protocol Name</Label>
                <Input 
                    type="text" 
                    placeholder="protocol_name" 
                    value={$protocol?.name || ""} 
                    oninput={createTextInputHandler($protocol, 'name', updateProtocol, false)} 
                />
            </div>

            <!-- Protocol Version -->
            <div class="flex flex-col gap-2">
                <Label>Protocol Version</Label>
                <Input 
                    type="number" 
                    min="1"
                    value={$protocol?.version || 1} 
                    oninput={createNumberInputHandler($protocol, 'version', updateProtocol, 1)} 
                />
            </div>

            <!-- Copyright -->
            <div class="flex flex-col gap-2">
                <Label>Copyright</Label>
                <Textarea 
                    rows="4"
                    class="w-full text-sm"
                    placeholder="Copyright information (optional)" 
                    value={$protocol?.copyright || ""} 
                    oninput={createTextInputHandler($protocol, 'copyright', updateProtocol)} 
                />
                <Helper class="text-xs">Preserve original formatting and indentation</Helper>
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-2">
                <Label>Protocol Description</Label>
                <Textarea 
                    rows="6"
                    class="w-full"
                    placeholder="Full protocol description (optional)" 
                    value={$protocol?.description || ""} 
                    oninput={createTextInputHandler($protocol, 'description', updateProtocol)} 
                />
            </div>

            <hr class="my-4 border-gray-700" />

            <!-- Add Elements Section -->
            <div class="flex flex-col gap-3">
                <Label class="text-lg">Add Elements</Label>
                <div class="flex gap-3">
                    <Button color="green" class="flex-1" onclick={addObject}>
                        <PlusOutline size="xs" class="mr-2" />
                        Add Object
                    </Button>
                    <Button color="yellow" class="flex-1" onclick={addEnum}>
                        <PlusOutline size="xs" class="mr-2" />
                        Add Enum
                    </Button>
                </div>
            </div>

            <Helper class="text-xs opacity-60 mt-2">
                Elements: {$protocol?.elements?.length || 0} total
            </Helper>
        </div>
    </div>
{:else}
    <div class="flex flex-col gap-4 w-full p-4">
        <!-- Common: Name -->
        <div class="flex flex-col gap-2">
            <Label>Name</Label>
            <Input 
                type="text" 
                placeholder="element_name" 
                value={element.name} 
                oninput={createTextInputHandler(element, 'name', updateProtocol, false)} 
            />
        </div>

        <!-- Enum Value: idx -->
        {#if element.idx !== undefined}
            <div class="flex flex-col gap-2">
                <Label>Index</Label>
                <Input 
                    type="number" 
                    value={element.idx} 
                    oninput={createNumberInputHandler(element, 'idx', updateProtocol, 0)} 
                />
            </div>

            <div class="flex flex-col gap-2">
                <Label>Description</Label>
                <Input 
                    type="text" 
                    placeholder="Description of this enum value" 
                    value={element.description || ""} 
                    oninput={createTextInputHandler(element, 'description', updateProtocol)} 
                />
            </div>
        {/if}

        <!-- Object: version -->
        {#if element.type === 'object'}
            <div class="flex flex-col gap-2">
                <Label>Version</Label>
                <Input 
                    type="number" 
                    min="1"
                    value={element.version} 
                    oninput={createNumberInputHandler(element, 'version', updateProtocol, 1)} 
                />
            </div>
            
            <!-- Object Methods -->
            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <Label>Methods</Label>
                    <Button size="xs" color="green" onclick={addMethod}>
                        <PlusOutline size="xs" class="mr-1" />
                        Add Method
                    </Button>
                </div>
                
                {#if element.methods && element.methods.length > 0}
                    <div class="flex flex-col gap-2 max-h-96 overflow-y-auto">
                        {#each element.methods as method, i}
                            <div class="border border-gray-600 rounded p-3 flex flex-col gap-2 bg-gray-800">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-semibold">{method.name}</span>
                                    <Button size="xs" color="red" onclick={() => removeMethod(i)}>
                                        <TrashBinSolid size="xs" />
                                    </Button>
                                </div>
                                <span class="text-xs opacity-60">
                                    {method.direction === 'c2s' ? '→ Server' : 'Client ←'} • 
                                    {method.args?.length || 0} args
                                    {#if method.returns} • Returns: {method.returns}{/if}
                                </span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <Helper class="text-xs opacity-60">No methods yet. Click "Add Method" to create one.</Helper>
                {/if}
            </div>
        {/if}

        <!-- Method: direction -->
        {#if element.direction}
            <div class="flex flex-col gap-2">
                <Label>Direction</Label>
                <Select 
                    items={directionOptions}
                    bind:value={element.direction}
                    onchange={createSelectHandler(element, 'direction', updateProtocol)}
                />
            </div>

            <div class="flex flex-col gap-2">
                <Label class="flex items-center gap-2">
                    <Toggle
                        checked={element.destructor || false}
                        onchange={createCheckboxHandler(element, 'destructor', updateProtocol)}
                    >
                        Destructor
                    </Toggle>                    
                </Label>
            </div>
        {/if}

        <!-- Description (for objects and methods) -->
        {#if element.type === 'object' || element.direction}
            <div class="flex flex-col gap-2">
                <Label>Description Summary</Label>
                <Input 
                    type="text" 
                    placeholder="Short summary" 
                    value={element.description?.summary || ""} 
                    oninput={(e) => {
                        ensureDescription(element);
                        element.description.summary = e.target.value || undefined;
                        updateProtocol();
                    }} 
                />
            </div>

            <div class="flex flex-col gap-2">
                <Label>Description Text</Label>
                <Textarea 
                    rows="4"
                    class="w-full"
                    placeholder="Full description text" 
                    value={element.description?.text || ""} 
                    oninput={(e) => {
                        ensureDescription(element);
                        element.description.text = e.target.value || undefined;
                        updateProtocol();
                    }} 
                />
            </div>
        {/if}

        <!-- Method: Arguments -->
        {#if element.args !== undefined}
            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <Label>Arguments</Label>
                    <Button size="xs" color="green" onclick={addArgument}>
                        <PlusOutline size="xs" class="mr-1" />
                        Add Argument
                    </Button>
                </div>
                
                {#each element.args as arg, i}
                    <div class="border border-gray-600 rounded p-3 flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-semibold">Argument {i + 1}</span>
                            <Button size="xs" color="red" onclick={() => removeArgument(i)}>
                                <TrashBinSolid size="xs" />
                            </Button>
                        </div>
                        
                        <Input 
                            size="sm"
                            placeholder="Argument name" 
                            value={arg.name} 
                            oninput={createTextInputHandler(arg, 'name', updateProtocol, false)} 
                        />
                        
                        <Select 
                            size="sm"
                            items={typeOptions}
                            bind:value={arg.type}
                            onchange={createSelectHandler(arg, 'type', updateProtocol)}
                        />

                        {#if arg.type === 'enum'}
                            <Input 
                                size="sm"
                                placeholder="Interface name" 
                                value={arg.interface || ""} 
                                oninput={createTextInputHandler(arg, 'interface', updateProtocol)} 
                            />
                        {/if}
                        
                        <Input 
                            size="sm"
                            placeholder="Summary (optional)" 
                            value={arg.summary || ""} 
                            oninput={createTextInputHandler(arg, 'summary', updateProtocol)} 
                        />
                    </div>
                {/each}
            </div>

            <!-- Method: Returns (for c2s only) -->
            {#if element.direction === 'c2s'}
                <div class="flex flex-col gap-2">
                    <Label>Returns Interface</Label>
                    <Input 
                        type="text" 
                        placeholder="Interface name (optional)" 
                        value={element.returns || ""} 
                        oninput={createTextInputHandler(element, 'returns', updateProtocol)} 
                    />
                </div>
            {/if}
        {/if}

        <!-- Enum: Values -->
        {#if element.type === 'enum' && element.values !== undefined}
            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <Label>Enum Values</Label>
                    <Button size="xs" color="green" onclick={addEnumValue}>
                        <PlusOutline size="xs" class="mr-1" />
                        Add Value
                    </Button>
                </div>
                
                {#each element.values as value, i}
                    <div class="border border-gray-600 rounded p-3 flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-semibold">Value {i + 1}</span>
                            <Button size="xs" color="red" onclick={() => removeEnumValue(i)}>
                                <TrashBinSolid size="xs" />
                            </Button>
                        </div>
                        
                        <Input 
                            size="sm"
                            type="number"
                            placeholder="Index" 
                            value={value.idx} 
                            oninput={createNumberInputHandler(value, 'idx', updateProtocol, 0)} 
                        />
                        
                        <Input 
                            size="sm"
                            placeholder="Value name" 
                            value={value.name} 
                            oninput={createTextInputHandler(value, 'name', updateProtocol, false)} 
                        />
                        
                        <Input 
                            size="sm"
                            placeholder="Description (optional)" 
                            value={value.description || ""} 
                            oninput={createTextInputHandler(value, 'description', updateProtocol)} 
                        />
                    </div>
                {/each}
            </div>
        {/if}

        {#if element.type === 'object' || element.type === 'enum'}
            <div class="flex justify-end mb-2">
                <Button size="xs" color="red" onclick={deleteCurrentElement}>
                    <TrashBinSolid size="xs" class="mr-2" />
                    Delete {element.type === 'object' ? 'Object' : 'Enum'}
                </Button>
            </div>
        {/if}

        <Helper class="text-xs opacity-60 mt-2">
            Type: {element.type || (element.idx !== undefined ? 'enum value' : element.direction ? 'method' : 'unknown')}
        </Helper>
    </div>
{/if}
