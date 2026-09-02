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

const youtubeReadyStart = html.indexOf("function onYouTubeIframeAPIReady(){");
const youtubeReadyEnd = html.indexOf("document.getElementById('audioSwitchButton').onclick", youtubeReadyStart);
if (youtubeReadyStart !== -1 && youtubeReadyEnd !== -1) {
  const newYouTubeReady = "function onYouTubeIframeAPIReady(){const init=()=>{if(youtubePlayer)return;if(!youtubeVideos.length){setTimeout(init,250);return}const video=getNextYouTubeVideo();if(!video)return;currentYouTubeVideo=video;setYouTubeVideoMeta(video);youtubePlayer=new YT.Player('youtubePlayerArea',{width:'100%',height:'100%',videoId:video.video_id,playerVars:{autoplay:1,mute:1,rel:0,playsinline:1,enablejsapi:1,origin:location.origin},events:{onReady:function(){youtubeReady=true;if(audioMode==='twitch'){youtubePlayer.mute();youtubeMuted=true}else{youtubePlayer.unMute();youtubeMuted=false}youtubePlayer.playVideo();applyAudioMode()},onStateChange:function(event){if(event.data===YT.PlayerState.ENDED)playRandomYouTubeVideo()},onAutoplayBlocked:function(){console.log('YouTube autoplay blocked; player remains available for user interaction')}}})};init()}";
  html = html.slice(0, youtubeReadyStart) + newYouTubeReady + html.slice(youtubeReadyEnd);
}

await writeFile(path, html);
console.log("Player compatibility fixes applied.");
