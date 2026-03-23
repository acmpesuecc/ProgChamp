import { spawn } from "bun";



const be = spawn(["bun", "run", "dev"], { cwd: "./backend", stdout: "inherit", stderr: "inherit" });
const fe = spawn(["npm", "run", "dev"], { cwd: "./frontend", stdout: "inherit", stderr: "inherit" });

process.on("SIGINT", () => { be.kill(); fe.kill(); process.exit(0); });

await Promise.all([be.exited, fe.exited]);
