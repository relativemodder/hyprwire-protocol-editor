import { writable } from 'svelte/store';

/** @import { Protocol } from "$lib/parser" */

/**
 * Store for the current protocol
 * @type {import('svelte/store').Writable<Protocol | null>}
 */
export const protocol = writable(null);

/**
 * Store for the currently selected protocol element
 * @type {import('svelte/store').Writable<any>}
 */
export const selectedElement = writable(null);

/**
 * Force update trigger for sidebar reactivity
 * @type {import('svelte/store').Writable<boolean>}
 */
export const sidebarUpdateTrigger = writable(true);
