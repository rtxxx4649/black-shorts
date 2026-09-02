import { mkdir, copyFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await copyFile("index2.html", "dist/index.html");
await copyFile("e2e1003b-f8c4-4441-924c-df430cc634a5.png", "dist/e2e1003b-f8c4-4441-924c-df430cc634a5.png");
