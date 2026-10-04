import { useEffect, useRef, useState } from "react";
import "./VideoPlayer.css";

const timeLabel = (seconds) => Number.isFinite(seconds) && seconds >= 0
  ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}` : "--:--";
function Icon({ name }) {
  const paths = {
    play: <path d="M5 3.5 13 8l-8 4.5Z" fill="currentColor" stroke="none" />,
    pause: <path d="M5 3v10M11 3v10" strokeWidth="3" />,
    sound: <><path d="M2 6h3l4-3v10l-4-3H2Z" /><path d="M12 5a5 5 0 0 1 0 6" /></>,
    mute: <><path d="M2 6h3l4-3v10l-4-3H2Z" /><path d="m12 6 3 4m0-4-3 4" /></>,
    fullscreen: <path d="M6 2H2v4m8-4h4v4M2 10v4h4m8-4v4h-4" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Playback({ src, poster, title, width, height, className = "" }) {
  const playerRef = useRef(null), videoRef = useRef(null);
  const [playing, setPlaying] = useState(false), [started, setStarted] = useState(false);
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false), [error, setError] = useState(src ? "" : "No video file is available.");
  const [time, setTime] = useState(0), [duration, setDuration] = useState(null), [muted, setMuted] = useState(false);
  const [natural, setNatural] = useState(null), [fullscreen, setFullscreen] = useState(false), [notice, setNotice] = useState("");
  const ratio = Number(width) > 0 && Number(height) > 0 && Number.isFinite(Number(width) / Number(height))
    ? Number(width) / Number(height) : natural;
  const seekable = Number.isFinite(duration) && duration > 0;
  useEffect(() => {
    const player = playerRef.current, video = videoRef.current, doc = player.ownerDocument;
    const changed = () => setFullscreen(doc.fullscreenElement === player || doc.webkitFullscreenElement === player);
    const entered = () => setFullscreen(true), exited = () => setFullscreen(false);
    doc.addEventListener("fullscreenchange", changed); doc.addEventListener("webkitfullscreenchange", changed);
    video.addEventListener("webkitbeginfullscreen", entered); video.addEventListener("webkitendfullscreen", exited);
    return () => {
      video.pause();
      doc.removeEventListener("fullscreenchange", changed); doc.removeEventListener("webkitfullscreenchange", changed);
      video.removeEventListener("webkitbeginfullscreen", entered); video.removeEventListener("webkitendfullscreen", exited);
    };
  }, []);
  useEffect(() => {
    if (!requested || !loading || error) return;
    const timer = setTimeout(() => { setLoading(false); setError("Playback is taking longer than expected. Retry or open the original file."); }, 12000);
    return () => clearTimeout(timer);
  }, [requested, loading, error]);
  const metadata = () => {
    const video = videoRef.current;
    setDuration(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null);
    if (video.videoWidth > 0 && video.videoHeight > 0) setNatural(video.videoWidth / video.videoHeight);
    setLoading(false);
  };
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!src || error) return;
    if (!video.paused) { video.pause(); return; }
    setRequested(true); setLoading(true); setNotice("");
    try { await video.play(); } catch { setLoading(false); setNotice("Playback could not start. Press Play to try again."); }
  };
  const seek = (event) => {
    if (!seekable) return;
    const next = Math.max(0, Math.min(duration, Number(event.target.value) || 0));
    try { videoRef.current.currentTime = next; setTime(next); } catch { setNotice("Seeking is not available yet. Let the video load and try again."); }
  };
  const toggleMute = () => { const video = videoRef.current; video.muted = !video.muted; setMuted(video.muted); };
  const toggleFullscreen = async () => {
    const player = playerRef.current, video = videoRef.current, doc = player.ownerDocument;
    try {
      if (doc.fullscreenElement === player) await doc.exitFullscreen();
      else if (doc.webkitFullscreenElement === player && doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (fullscreen && video.webkitExitFullscreen) video.webkitExitFullscreen();
      else if (player.requestFullscreen) await player.requestFullscreen();
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else setNotice("Fullscreen is not available here. You can keep watching in this frame.");
    } catch { setNotice("Fullscreen could not open. You can keep watching in this frame."); }
  };
  const retry = () => {
    setError(""); setNotice(""); setRequested(false); setStarted(false); setPlaying(false); setLoading(true); setTime(0); setDuration(null);
    videoRef.current.load();
  };
  const controlKeys = (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar", "Home", "End"].includes(event.key)) event.stopPropagation();
  };
  return <div ref={playerRef} className={`video-player ${className}`} role="group" aria-label={title || "Video player"} style={ratio ? { "--vp-ratio": ratio } : undefined}>
    <div className="vp-stage">
      <video ref={videoRef} className="vp-video" src={src || undefined} poster={poster || undefined} playsInline preload="metadata" muted={muted}
        onLoadedMetadata={metadata} onDurationChange={metadata} onLoadStart={() => setLoading(true)} onCanPlay={() => setLoading(false)}
        onPlay={() => { setRequested(true); setPlaying(true); setLoading(true); }} onPlaying={() => { setPlaying(true); setStarted(true); setLoading(false); setError(""); }}
        onPause={() => { setPlaying(false); setLoading(false); }} onEnded={() => { setPlaying(false); setLoading(false); }}
        onWaiting={() => setLoading(true)} onStalled={() => setLoading(true)} onSeeking={() => setLoading(true)} onSeeked={() => setLoading(false)}
        onTimeUpdate={() => setTime(videoRef.current.currentTime || 0)} onVolumeChange={() => setMuted(videoRef.current.muted)}
        onError={() => { setError("This video could not load. Retry or open the original file."); setLoading(false); setPlaying(false); }} />
      {poster && !started && <img className="vp-poster" src={poster} alt="" aria-hidden="true" draggable="false" decoding="async" />}
      {requested && loading && !error && <span className="vp-loading" role="status">Loading video…</span>}
      {error && <div className="vp-error" role="alert"><p>{error}</p><div>
        {src && <><button type="button" onClick={retry}>Retry</button><a href={src} target="_blank" rel="noopener noreferrer">Open original</a></>}
      </div></div>}
    </div>
    <div className="vp-controls" onKeyDown={controlKeys}>
      <button type="button" className="vp-play" aria-label={playing ? "Pause video" : "Play video"} onClick={togglePlay} disabled={!src || Boolean(error)}><Icon name={playing ? "pause" : "play"} /></button>
      <input className="vp-seek" type="range" min="0" max={seekable ? duration : 0} step="0.1" value={seekable ? Math.min(time, duration) : 0} onChange={seek} disabled={!seekable || Boolean(error)}
        aria-label="Seek video" aria-valuetext={`${timeLabel(time)} of ${timeLabel(duration)}`} />
      <span className="vp-time" aria-live="off">{timeLabel(time)} / {timeLabel(duration)}</span>
      <button type="button" className="vp-mute" aria-label={muted ? "Unmute video" : "Mute video"} aria-pressed={muted} onClick={toggleMute} disabled={!src}><Icon name={muted ? "mute" : "sound"} /></button>
      <button type="button" className="vp-fullscreen" aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} onClick={toggleFullscreen} disabled={!src}><Icon name="fullscreen" /></button>
    </div>
    {notice && <p className="vp-notice" role="status">{notice}</p>}
  </div>;
}

export default function VideoPlayer(props) {
  return <Playback key={props.src || "no-source"} {...props} />;
}
