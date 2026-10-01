import { useEffect, useRef, useState } from "react";
import { sketchImageDimensions } from "../data/sketchImageDimensions.js";
import { fullSketchImages } from "../lib/sketchImageCache.js";

export default function SketchLightboxImage({ item, previewSrc }) {
  const preview = previewSrc || item.thumbWebp;
  const [source, setSource] = useState(() => fullSketchImages.ready(item.full) ? item.full : preview);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);
  const [width, height] = sketchImageDimensions[item.slug] || [];

  useEffect(() => {
    let current = true;
    alive.current = true;
    fullSketchImages.load(item.full, { priority: "high", retry: true }).then(
      () => { if (current) { setSource(item.full); setFailed(false); } },
      () => { if (current) setFailed(true); },
    );
    return () => { current = false; alive.current = false; };
  }, [item.full]);

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
      <img
        src={source}
        width={width}
        height={height}
        alt={`${item.title}, ${item.medium}, ${item.year}, by Ashvini Kumar`}
        decoding="async"
        fetchPriority="high"
        onError={() => { setFailed(true); if (source === item.full) setSource(preview); }}
      />
      {failed && <p className="sk-image-retry" role="status">Image didn’t finish loading. <button type="button" onClick={retry}>Try again</button></p>}
    </div>
  );
}
