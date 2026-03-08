// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from "@auth/core/types";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getSession(): Promise<Session | null>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
