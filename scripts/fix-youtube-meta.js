import { readFile, writeFile } from "node:fs/promises";

const path = "index2.html";
const html = await readFile(path, "utf8");
const before = "const likes=Number(video.likes||0).toLocaleString('en-US');const comments=Number(video.comments||0).toLocaleString('en-US');stats.textContent=likes+' likes · '+comments+' comments'";
const after = "const views=Number(video.views||0).toLocaleString('en-US');stats.textContent=views+' views'";

if (!html.includes(before)) {
  throw new Error("YouTube metadata source pattern was not found in index2.html");
}

const youtubeMetaFixed = html.replace(before, after);
const twitchGapBefore = "margin-bottom:clamp(6px,1vw,14px);";
const twitchGapAfter = "margin-bottom:0;";
const finalHtml = youtubeMetaFixed.replace(twitchGapBefore, twitchGapAfter);

await writeFile(path, finalHtml, "utf8");
