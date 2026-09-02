import { readFile, writeFile } from "node:fs/promises";

const path = "index2.html";
let html = await readFile(path, "utf8");

const youtubeMetaBefore = "const likes=Number(video.likes||0).toLocaleString('en-US');const comments=Number(video.comments||0).toLocaleString('en-US');stats.textContent=likes+' likes · '+comments+' comments'";
const youtubeMetaAfter = "const views=Number(video.views||0).toLocaleString('en-US');stats.textContent=views+' views'";
if (html.includes(youtubeMetaBefore)) html = html.replace(youtubeMetaBefore, youtubeMetaAfter);

html = html.replace(/margin-bottom:clamp\(6px,1vw,14px\);/, "margin-bottom:0;");

const mobileFitCss = ".audio-switch-button{height:46px;width:min(90vw,1200px)}.mobile-fit-stack .twitch-player,.mobile-fit-stack .youtube-player{width:100%!important;height:var(--mobile-player-height)!important;min-height:0!important}.mobile-fit-stack .twitch-video-frame,.mobile-fit-stack .youtube-player iframe{width:100%!important;height:100%!important}}";
const mobileFitCssPattern = /\.audio-switch-button\{height:46px;width:min\(90vw,1200px\)\}\}/;
if (!html.includes(".mobile-fit-stack .twitch-player")) {
  if (!mobileFitCssPattern.test(html)) throw new Error("Mobile player CSS source pattern was not found in index2.html");
  html = html.replace(mobileFitCssPattern, mobileFitCss);
}

const mobileFitJs = "let mobilePlayerHeightLocked=null;function fitMobilePlayerStack(){const root=document.documentElement;if(window.innerWidth>700){document.body.classList.remove('mobile-fit-stack');root.style.removeProperty('--mobile-player-height');mobilePlayerHeightLocked=null;return}const twitchPlayer=document.getElementById('twitchPlayerArea');const youtubePlayerArea=document.getElementById('youtubePlayerArea');const controls=document.querySelector('.page-controls');const twitchTitle=document.getElementById('twitchStreamTitleBottom');const twitchMeta=document.getElementById('twitchStreamMetaBottom');const youtubeTitle=document.getElementById('youtubeVideoTitle');const youtubeMeta=document.querySelector('.youtube-video-meta');if(!twitchPlayer||!youtubePlayerArea||!controls||!twitchTitle||!twitchMeta||!youtubeTitle||!youtubeMeta)return;const isVisible=el=>{if(!el)return false;const style=getComputedStyle(el);const rect=el.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse'&&rect.width>0&&rect.height>0};const twitchFrame=twitchPlayer.querySelector('.twitch-video-frame');const twitchReady=!!player&&!!twitchFrame&&isVisible(twitchPlayer)&&isVisible(twitchFrame);const youtubeReady=isVisible(youtubePlayerArea);const controlsReady=isVisible(controls);if(mobilePlayerHeightLocked===null&&twitchReady&&youtubeReady&&controlsReady){const viewportHeight=window.visualViewport?window.visualViewport.height:window.innerHeight;const fixedHeight=twitchTitle.getBoundingClientRect().height+twitchMeta.getBoundingClientRect().height+youtubeTitle.getBoundingClientRect().height+youtubeMeta.getBoundingClientRect().height+controls.getBoundingClientRect().height;const available=Math.max(0,viewportHeight-fixedHeight);mobilePlayerHeightLocked=Math.max(0,available/2)}if(mobilePlayerHeightLocked!==null){document.body.classList.add('mobile-fit-stack');root.style.setProperty('--mobile-player-height',mobilePlayerHeightLocked+'px')}}function resetMobilePlayerLockAndRefit(){mobilePlayerHeightLocked=null;fitMobilePlayerStack()}window.addEventListener('resize',resetMobilePlayerLockAndRefit);window.visualViewport&&window.visualViewport.addEventListener('resize',resetMobilePlayerLockAndRefit);window.addEventListener('orientationchange',()=>setTimeout(resetMobilePlayerLockAndRefit,100));const mobileFitObserver=new MutationObserver(()=>requestAnimationFrame(fitMobilePlayerStack));const twitchSection=document.getElementById('twitch');const youtubeSection=document.getElementById('youtube');const controlsArea=document.querySelector('.page-controls');if(twitchSection)mobileFitObserver.observe(twitchSection,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});if(youtubeSection)mobileFitObserver.observe(youtubeSection,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});if(controlsArea)mobileFitObserver.observe(controlsArea,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});requestAnimationFrame(fitMobilePlayerStack);document.getElementById('audioSwitchButton').onclick=()=>{audioMode=audioMode==='twitch'?'youtube':'twitch';applyAudioMode()};";
const audioHandlerPattern = /document\.getElementById\('audioSwitchButton'\)\.onclick=\(\)=>\{audioMode=audioMode==='twitch'\?'youtube':'twitch';applyAudioMode\(\)\};/;
if (!html.includes("let mobilePlayerHeightLocked=null;")) {
  if (!audioHandlerPattern.test(html)) throw new Error("Audio switch handler source pattern was not found in index2.html");
  html = html.replace(audioHandlerPattern, mobileFitJs);
}

await writeFile(path, html, "utf8");
