import { readFile, writeFile } from "node:fs/promises";

const path = "index2.html";
let html = await readFile(path, "utf8");

const marker = "/* desktop-viewport-responsive-v1 */";
if (!html.includes(marker)) {
  const desktopResponsiveCss = `<style>${marker}
@media (min-width:701px){
  html,body{width:100%;max-width:none;overflow-x:hidden}
  .header{width:100%;padding-left:clamp(12px,1.5vw,20px);padding-right:clamp(12px,1.5vw,20px);padding-bottom:clamp(180px,32vh,442px)}
  .site-title{font-size:clamp(52px,8vw,160px)!important;line-height:1.05}
  .site-subtitle{font-size:clamp(18px,2.2vw,44px)!important;margin-top:clamp(6px,.8vw,12px)}
  .twitch-player{width:100%;max-width:100%;height:56.25vw;min-height:0}
  #youtubePlayerArea{width:100%!important;max-width:100%!important;height:auto!important;aspect-ratio:16/9;min-height:0}
  .twitch-stream-title#twitchStreamTitleBottom,.youtube-video-title{font-size:clamp(16px,1.5vw,28px);padding-left:clamp(12px,1.5vw,28px);padding-right:clamp(12px,1.5vw,28px)}
  .twitch-stream-meta#twitchStreamMetaBottom,.youtube-video-meta{gap:clamp(8px,1vw,16px);padding-left:clamp(12px,1.5vw,28px);padding-right:clamp(12px,1.5vw,28px);padding-top:clamp(8px,.8vw,14px);padding-bottom:clamp(10px,1vw,18px)}
  .twitch-stream-meta#twitchStreamMetaBottom{margin-bottom:0}
  .twitch-stream-meta#twitchStreamMetaBottom .twitch-stream-avatar,.youtube-video-avatar{width:clamp(30px,2.8vw,52px);height:clamp(30px,2.8vw,52px)}
  .twitch-stream-meta#twitchStreamMetaBottom .twitch-stream-name,.youtube-video-channel{font-size:clamp(15px,1.35vw,24px)}
  .twitch-stream-meta#twitchStreamMetaBottom .twitch-stream-viewers,.youtube-video-stats{font-size:clamp(13px,1.1vw,20px)}
  .page-controls{width:100%;gap:clamp(4px,.4vw,8px);padding-top:clamp(6px,.6vw,12px);padding-bottom:clamp(10px,1vw,20px)}
  .page-controls button,.audio-switch-button{height:clamp(84px,9.75vw,180px);font-size:clamp(15px,1.35vw,24px)}
  .page-controls .twitch-switch-controls,.page-controls .youtube-switch-controls,.page-controls .audio-switch-button{width:100%}
  .country-name{padding:clamp(12px,1.5vw,24px)}
  .country-location{font-size:clamp(18px,2vw,36px)}
  .slider{gap:clamp(12px,1.5vw,28px);padding-left:clamp(12px,1.5vw,28px);padding-right:clamp(12px,1.5vw,28px)}
  .item{flex-basis:clamp(220px,20vw,360px);padding:clamp(8px,1vw,14px)}
  .video-title{margin-top:clamp(6px,.8vw,12px);height:clamp(48px,4.5vw,72px);font-size:clamp(13px,1.1vw,20px)}
  .score{font-size:clamp(12px,1vw,18px);margin-top:clamp(6px,.8vw,12px)}
}
@media (max-width:700px){
  .header{
    height:165px;
    min-height:165px;
    padding:0 20px;
    margin-bottom:0;
    background-color:#000;
    background-image:linear-gradient(90deg,#0004,#0001,#0004),url('./e2e1003b-f8c4-4441-924c-df430cc634a5.png');
    background-position:center;
    background-size:cover;
    background-repeat:no-repeat;
    text-align:left;
  }
  .twitch-section{margin-top:0}
  .twitch-stream-meta#twitchStreamMetaBottom{margin-bottom:0}
}
</style>`;
  const styleEnd = html.indexOf("</style>");
  if (styleEnd === -1) throw new Error("Style closing tag was not found in index2.html");
  html = html.slice(0, styleEnd + 8) + desktopResponsiveCss + html.slice(styleEnd + 8);
  await writeFile(path, html, "utf8");
}

const mobileTitleMarker = "/* mobile-header-text-size-v1 */";
if (!html.includes(mobileTitleMarker)) {
  const mobileHeaderTextCss = `<style>${mobileTitleMarker}
@media (max-width:700px){
  .site-title{
    font-size:29.25px;
    text-align:left;
    margin-left:0;
  }
  .site-subtitle{
    font-size:11.7px;
    text-align:left;
    margin-left:0;
  }
}
</style>`;
  const styleEnd = html.indexOf("</style>");
  if (styleEnd === -1) throw new Error("Style closing tag was not found in index2.html");
  html = html.slice(0, styleEnd + 8) + mobileHeaderTextCss + html.slice(styleEnd + 8);
  await writeFile(path, html, "utf8");
}

const mobileTitlePositionMarker = "/* mobile-header-text-position-v1 */";
if (!html.includes(mobileTitlePositionMarker)) {
  const mobileHeaderTextPositionCss = `<style>${mobileTitlePositionMarker}
@media (max-width:700px){
  .site-title,
  .site-subtitle{
    margin-left:-20px;
    position:relative;
    top:38px;
  }
}
</style>`;
  const styleEnd = html.indexOf("</style>");
  if (styleEnd === -1) throw new Error("Style closing tag was not found in index2.html");
  html = html.slice(0, styleEnd + 8) + mobileHeaderTextPositionCss + html.slice(styleEnd + 8);
  await writeFile(path, html, "utf8");
}

const mobileTitleLeftMarker = "/* mobile-header-text-left-v1 */";
if (!html.includes(mobileTitleLeftMarker)) {
  const mobileHeaderTextLeftCss = `<style>${mobileTitleLeftMarker}
@media (max-width:700px){
  .site-title,
  .site-subtitle{
    margin-left:-28px;
  }
}
</style>`;
  const styleEnd = html.indexOf("</style>");
  if (styleEnd === -1) throw new Error("Style closing tag was not found in index2.html");
  html = html.slice(0, styleEnd + 8) + mobileHeaderTextLeftCss + html.slice(styleEnd + 8);
  await writeFile(path, html, "utf8");
}