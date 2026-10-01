import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { transitionsSettled } from "../lib/viewTransition.js";
import { Cutout } from "./Sketches.jsx";
import SketchbookPreloader from "./SketchbookPreloader.jsx";

const reveal = () => {};

// Query-string previews never read or write the normal hourly cooldown.
export default function SketchbookLoaderPreview({ pageRef, onStart, onDone }) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const finish = useCallback(() => { setDone(true); onDone(); }, [onDone]);
  useLayoutEffect(() => { onStart(); }, [onStart]);
  useEffect(() => {
    let active = true;
    transitionsSettled().then(() => { if (active) setPlaying(true); });
    return () => { active = false; };
  }, []);
  if (done) return null;
  return (
    <SketchbookPreloader playing={playing} pageRef={pageRef} onReveal={reveal} onDone={finish}>
      <Cutout text="ASHVINI" size={0.4} seed={51} />
    </SketchbookPreloader>
  );
}
