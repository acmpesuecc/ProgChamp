// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      user?: {
        id: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
        userType: "normal" | "admin";
        superlikesRemaining: number;at
        profileCompletedAt: number | null;
        createdAt: number;
      };
      session?: {
        authenticated: boolean;
        needsProfileSetup: boolean;
        user?: Locals["user"];
      };
    }
  }
}

export {};
