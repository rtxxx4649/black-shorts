import { readFile, writeFile } from "node:fs/promises";
const path = "index2.html";
let html = await readFile(path, "utf8");
const youtubeApi = '<script src="https://www.youtube.com/iframe_api"></script>';
if (!html.includes(youtubeApi)) html = html.replace('<script src="https://player.twitch.tv/js/embed/v1.js"></script><script>', '<script src="https://player.twitch.tv/js/embed/v1.js"></script>'+youtubeApi+'<script>');
const ytStart = html.indexOf("function onYouTubeIframeAPIReady(){");
const ytEnd = html.indexOf("document.getElementById('audioSwitchButton').onclick", ytStart);
if (ytStart !== -1 && ytEnd !== -1) {
  const helper = `function fallbackYouTubeIframe(video){if(!video||!video.video_id)return;currentYouTubeVideo=video;setYouTubeVideoMeta(video);const area=document.getElementById('youtubePlayerArea');area.innerHTML='';const iframe=document.createElement('iframe');iframe.src='https://www.youtube.com/embed/'+encodeURIComponent(video.video_id)+'?autoplay=1&mute=1&rel=0&playsinline=1';iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.style.cssText='display:block;width:100%;height:100%;border:0';area.appendChild(iframe);}`;
  const fn = `function onYouTubeIframeAPIReady(){const init=()=>{if(!youtubeVideos.length){setTimeout(init,250);return}const video=getNextYouTubeVideo();if(!video)return;try{youtubePlayer=new YT.Player('youtubePlayerArea',{width:'100%',height:'100%',videoId:video.video_id,playerVars:{autoplay:1,mute:1,rel:0,playsinline:1},events:{onReady:function(){youtubeReady=true;youtubePlayer.playVideo()},onStateChange:function(e){if(e.data===YT.PlayerState.ENDED)playRandomYouTubeVideo()},onError:function(){fallbackYouTubeIframe(video)}}})}catch(e){fallbackYouTubeIframe(video)}};init();setTimeout(()=>{if(!youtubePlayer&&youtubeVideos.length)fallbackYouTubeIframe(getNextYouTubeVideo())},5000)}`;
  html = html.slice(0, ytStart)+helper+fn+html.slice(ytEnd);
}
const twStart = html.indexOf("function createPlayer(name,autoplay){");
const twEnd = html.indexOf("async function loadTwitch", twStart);
if (twStart !== -1 && twEnd !== -1) {
  const fn = `function createPlayer(name,autoplay){const a=document.getElementById('twitchPlayerArea');a.innerHTML='';const iframe=document.createElement('iframe');iframe.className='twitch-video-frame';iframe.src='https://player.twitch.tv/?channel='+encodeURIComponent(name)+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=true&muted='+(audioMode!=='twitch');iframe.allow='autoplay;fullscreen';iframe.allowFullscreen=true;iframe.style.cssText='width:100%;height:100%;border:0;background:#111';a.appendChild(iframe);}`;
  html = html.slice(0, twStart)+fn+html.slice(twEnd);
}
await writeFile(path, html);
console.log('Cloudflare direct player fallback patch applied.');
