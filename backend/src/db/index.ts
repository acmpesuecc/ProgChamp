import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient(
  process.env.TURSO_DATABASE_URL
    ? {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }
    : {
      url: "file:local.db",
    }
);

export const db = drizzle(client, { schema });