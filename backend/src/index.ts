import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("OK"));

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });

  console.log("Backend running on http://localhost:9210");
}
