import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import profile from "./routes/profile";
import gameRequests from "./routes/gameRequests";
import userRequests from "./routes/userRequests";
import adminGameRequests from "./routes/adminGameRoutes";

const app = new Hono();

// remove *
app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => c.text("OK"));
app.route("/auth", auth);
app.route("/profile", profile);
app.route("/game-requests", gameRequests); // Accessible at /game-requests
app.route("/user-requests", userRequests); // Accessible at /user-requests
app.route("/admin/game-requests", adminGameRequests); // Accessible at /admin/game-requests

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 9210,
  });
}
