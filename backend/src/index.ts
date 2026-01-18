import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import games from "./routes/games";

const app = new Hono();

// CORS middleware
app.use("/*", cors());

// Health check
app.get("/", (c) => c.text("OK"));

// Mount routes
app.route("/auth", auth);
app.route("/games", games);

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });

  console.log("Backend running on http://localhost:9210");
}