import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import profile from "./routes/profile";
import games from "./routes/games";
import media from "./routes/media";

const app = new Hono();

// CORS middleware - configure for your frontend
app.use("/*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Important: allows cookies to be sent
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/", (c) => c.text("OK"));

// Mount routes
app.route("/auth", auth);
app.route("/profile", profile);
app.route("/games", games);
app.route("/media", media);

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });
}