import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import profile from "./routes/profile";

const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  console.warn("FRONTEND_URL is not set, defaulting to http://localhost:3000");
}

const app = new Hono();

app.use(
  "/auth/*",
  "/profile/*",
  cors({
    origin: FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => c.text("OK"));
app.route("/auth", auth);
app.route("/profile", profile);

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });
  console.log("Backend running on http://localhost:9210");
}
