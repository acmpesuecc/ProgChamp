import { writable } from 'svelte/store';

// export const user = writable(null);

export const user = writable({
    isSignedIn: true,
    name: 'test',
    role: 'dev' 
});

