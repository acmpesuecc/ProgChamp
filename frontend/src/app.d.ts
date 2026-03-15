// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from "@auth/core/types";

// for information about these interfaces
// src/app.d.ts
declare global {
	namespace App {
	  interface Locals {
		user?: {
		  id: string;
		  email: string;
		  name: string | null;
		  avatarUrl: string | null;
		  userType: string;
		  superlikesRemaining: number;
		};
		session?: {
		  authenticated: boolean;
		  needsProfileSetup: boolean;
		  user?: Locals['user'];
		};
	  }
	}
  }
  export {};

