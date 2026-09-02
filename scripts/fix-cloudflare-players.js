import { readFile, writeFile } from "node:fs/promises";

const path = "index2.html";
let html = await readFile(path, "utf8");

const youtubeApiBefore = '<script src="https://player.twitch.tv/js/embed/v1.js"></script><script>';
const youtubeApiAfter = '<script src="https://player.twitch.tv/js/embed/v1.js"></script><script src="https://www.youtube.com/iframe_api"></script><script>';
if (html.includes(youtubeApiBefore) && !html.includes(youtubeApiAfter)) {
  html = html.replace(youtubeApiBefore, youtubeApiAfter);
}

const youtubePlayerVarsBefore = "playerVars:{autoplay:1,mute:1,rel:0,playsinline:1}";
const youtubePlayerVarsAfter = "playerVars:{autoplay:1,mute:1,rel:0,playsinline:1,enablejsapi:1,origin:location.origin}";
if (html.includes(youtubePlayerVarsBefore)) {
  html = html.replace(youtubePlayerVarsBefore, youtubePlayerVarsAfter);
}

const twitchChatBefore = "'/chat?parent='+encodeURIComponent(location.hostname)+'&darkpopout'";
const twitchChatAfter = "'/chat?parent='+encodeURIComponent(location.hostname)+'&darkpopout=true'";
if (html.includes(twitchChatBefore)) {
  html = html.replace(twitchChatBefore, twitchChatAfter);
}

const youtubeApiAtEnd = '</script><script src="https://www.youtube.com/iframe_api"></script></body>';
if (html.includes(youtubeApiAtEnd)) {
  html = html.replace(youtubeApiAtEnd, '</script></body>');
}

await writeFile(path, html);
console.log("Cloudflare player compatibility fixes applied.");
