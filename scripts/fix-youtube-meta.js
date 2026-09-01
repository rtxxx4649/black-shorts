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
const pageControlsGapBefore = ".page-controls{display:flex;flex-direction:column;gap:8px;";
const pageControlsGapAfter = ".page-controls{display:flex;flex-direction:column;gap:0;";
const mobilePageControlsGapBefore = ".page-controls{gap:8px;";
const mobilePageControlsGapAfter = ".page-controls{gap:0;";
const pageControlsFixed = youtubeMetaFixed.replace(twitchGapBefore, twitchGapAfter).replace(pageControlsGapBefore, pageControlsGapAfter).replace(mobilePageControlsGapBefore, mobilePageControlsGapAfter);

await writeFile(path, pageControlsFixed, "utf8");
