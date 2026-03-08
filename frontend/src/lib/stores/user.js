import { writable } from 'svelte/store';

//Mock user data

// export const user = writable(null);

export const user = writable({
    isSignedIn: true,
    name: 'test',
    role: 'dev',
    usedSuperLikes: 0,
    maxSuperLikes: 3
});

