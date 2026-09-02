// Desktop-only responsive player patch.
// Intentionally isolated behind min-width: 701px so mobile/tablet behavior is untouched.
(function () {
  const css = `
@media (min-width: 701px) {
  .twitch-player,
  .youtube-player {
    width: min(100%, 177.7778vh);
    max-width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    margin-left: auto;
    margin-right: auto;
  }

  .twitch-video-frame,
  .twitch-chat-frame,
  .youtube-player iframe {
    width: 100%;
    height: 100%;
  }
}
`;
  if (document.head && !document.getElementById('desktop-responsive-player-patch')) {
    const style = document.createElement('style');
    style.id = 'desktop-responsive-player-patch';
    style.textContent = css;
    document.head.appendChild(style);
  }
})();
