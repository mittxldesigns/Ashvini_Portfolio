import { useEffect, useRef, useState } from "react";
import VideoPlayer from "./VideoPlayer.jsx";
import { getSiteProfile } from "../data/siteProfile.js";
import { sketchImageDimensions } from "../data/sketchImageDimensions.js";
import { fullSketchImages } from "../lib/sketchImageCache.js";

export default function SketchLightboxImage({ item, previewSrc }) {
  const preview = previewSrc || item.thumbWebp;
  const [source, setSource] = useState(() => fullSketchImages.ready(item.full) ? item.full : preview);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);
  const [width, height] = item.width && item.height ? [item.width, item.height] : sketchImageDimensions[item.slug] || [];

  useEffect(() => {
    let current = true;
    alive.current = true;
    if (item.mediaType === "video") return () => { current = false; alive.current = false; };
    fullSketchImages.load(item.full, { priority: "high", retry: true }).then(
      () => { if (current) { setSource(item.full); setFailed(false); } },
      () => { if (current) setFailed(true); },
    );
    return () => { current = false; alive.current = false; };
  }, [item.full, item.mediaType]);

  const retry = () => {
    setFailed(false);
    fullSketchImages.load(item.full, { priority: "high", retry: true }).then(
      () => { if (alive.current) { setSource(item.full); setFailed(false); } },
      () => { if (alive.current) setFailed(true); },
    );
  };

  return (
    <div
      className="sk-lightbox-image"
      data-artwork={item.slug}
      data-image-quality={source === item.full ? "full" : "preview"}
      style={{ "--image-width": `${width || 800}px`, "--image-ratio": width && height ? width / height : 1 }}
    >
      {item.mediaType === "video" ? <VideoPlayer src={item.video || item.full} poster={item.poster || preview} title={`${item.title}, by ${getSiteProfile().name}`} width={width} height={height} /> : <img
        src={source}
        width={width}
        height={height}
        alt={[item.title, item.medium, item.year, item.client ? `designed for ${item.client}` : `by ${getSiteProfile().name}`].filter(Boolean).join(", ")}
        decoding="async"
        fetchPriority="high"
        onError={() => { setFailed(true); if (source === item.full) setSource(preview); }}
      />}
      {failed && item.mediaType !== "video" && <p className="sk-image-retry" role="status">Image didn’t finish loading. <button type="button" onClick={retry}>Try again</button></p>}
    </div>
  );
}
