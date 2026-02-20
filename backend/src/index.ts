import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import profile from "./routes/profile";
import games from "./routes/games";

const app = new Hono();

// remove *
app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  }),
);

app.get("/", (c) => c.text("OK"));
app.route("/auth", auth);
app.route("/profile", profile);
app.route("/games", games)

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });
}