import { writable } from 'svelte/store';

export const user = writable({
    name: 'Guest',
    role: 'dev' 
});

