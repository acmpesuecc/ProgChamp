import { spawn } from "bun";

console.log("Frontend: http://localhost:5173");
console.log("Backend:  http://localhost:9210");

const be = spawn(["bun", "run", "dev"], { cwd: "./backend", stdout: "inherit", stderr: "inherit" });
const fe = spawn(["npm", "run", "dev"], { cwd: "./frontend", stdout: "inherit", stderr: "inherit" });

process.on("SIGINT", () => { be.kill(); fe.kill(); process.exit(0); });

await Promise.all([be.exited, fe.exited]);