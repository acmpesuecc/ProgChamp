import { Hono } from "hono";
<<<<<<< Updated upstream
=======
import { cors } from "hono/cors";
import auth from "./routes/auth";
import profile from "./routes/profile";
import tagsRoute from './routes/tags';

>>>>>>> Stashed changes

const app = new Hono();

app.get("/", (c) => c.text("OK"));

app.route("/tags", tagsRoute);

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });

  console.log("Backend running on http://localhost:9210");
}
