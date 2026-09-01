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
const mobileFitCssBefore = ".audio-switch-button{height:46px;width:min(90vw,1200px)}}";
const mobileFitCssAfter = ".audio-switch-button{height:46px;width:min(90vw,1200px)}.mobile-fit-stack .twitch-player,.mobile-fit-stack .youtube-player{height:var(--mobile-player-height)!important;min-height:0!important}.mobile-fit-stack .twitch-video-frame{height:100%!important}.mobile-fit-stack .youtube-player iframe{height:100%!important}}";
const mobileFitJsBefore = "document.getElementById('audioSwitchButton').onclick=()=>{audioMode=audioMode==='twitch'?'youtube':'twitch';applyAudioMode()};";
const mobileFitJs = "function fitMobilePlayerStack(){if(window.innerWidth>700)return;const root=document.documentElement;const twitchPlayer=document.getElementById('twitchPlayerArea');const youtubePlayerArea=document.getElementById('youtubePlayerArea');const controls=document.querySelector('.page-controls');const twitchTitle=document.getElementById('twitchStreamTitleBottom');const twitchMeta=document.getElementById('twitchStreamMetaBottom');const youtubeTitle=document.getElementById('youtubeVideoTitle');const youtubeMeta=document.querySelector('.youtube-video-meta');if(!twitchPlayer||!youtubePlayerArea||!controls)return;document.body.classList.add('mobile-fit-stack');const viewportHeight=window.visualViewport?window.visualViewport.height:window.innerHeight;const fixedHeight=twitchTitle.getBoundingClientRect().height+twitchMeta.getBoundingClientRect().height+youtubeTitle.getBoundingClientRect().height+youtubeMeta.getBoundingClientRect().height+controls.getBoundingClientRect().height;const available=Math.max(0,viewportHeight-fixedHeight);root.style.setProperty('--mobile-player-height',Math.max(0,available/2)+'px')}window.addEventListener('resize',fitMobilePlayerStack);window.visualViewport&&window.visualViewport.addEventListener('resize',fitMobilePlayerStack);window.addEventListener('orientationchange',()=>setTimeout(fitMobilePlayerStack,100));requestAnimationFrame(fitMobilePlayerStack);document.getElementById('audioSwitchButton').onclick=()=>{audioMode=audioMode==='twitch'?'youtube':'twitch';applyAudioMode()};";

if (!youtubeMetaFixed.includes(mobileFitCssBefore)) {
  throw new Error("Mobile player CSS source pattern was not found in index2.html");
}
if (!youtubeMetaFixed.includes(mobileFitJsBefore)) {
  throw new Error("Mobile player JS source pattern was not found in index2.html");
}

const mobileFixedHtml = youtubeMetaFixed
  .replace(twitchGapBefore, twitchGapAfter)
  .replace(mobileFitCssBefore, mobileFitCssAfter)
  .replace(mobileFitJsBefore, mobileFitJs);

await writeFile(path, mobileFixedHtml, "utf8");
