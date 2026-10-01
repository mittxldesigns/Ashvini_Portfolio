import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import InfiniteDragGrid from "./componenets/InfiniteDragGrid.jsx";
import Home from "./componenets/Home.jsx";
import HeaderNav from "./componenets/HeaderNav.jsx";
import About from "./componenets/About.jsx";
import Editorial from "./componenets/Editorial.jsx";
import Sketches from "./componenets/Sketches.jsx";
import ProjectDetail from "./componenets/ProjectDetail.jsx";
import SeoHead from "./componenets/SeoHead.jsx";
import { notifyRouteCommit } from "./lib/viewTransition.js";
import { isSketchLoaderPreview } from "./lib/sketchPreloader.js";
import SketchbookLoaderPreview from "./componenets/SketchbookLoaderPreview.jsx";

// Fires once the DOM for a new location has committed; view transitions
// wait on it before capturing the new page.
function RouteCommitSignal() {
  const location = useLocation();
  useLayoutEffect(() => {
    notifyRouteCommit();
  }, [location.key]);
  return null;
}

// Route changes animate through the View Transitions API
// (src/lib/viewTransition.js); pages carry their own entrance motion as a
// fallback where it's unsupported.
function RoutedContent() {
  const location = useLocation();
  const pageRef = useRef(null);
  const [previewFinishedKey, setPreviewFinishedKey] = useState(null);
  const preview = isSketchLoaderPreview(location.search);
  const showingPreview = preview && previewFinishedKey !== location.key;
  const startPreview = useCallback(() => setPreviewFinishedKey(null), []);
  const finishPreview = useCallback(() => setPreviewFinishedKey(location.key), [location.key]);

  return (
    <>
      <SeoHead />
      <div ref={pageRef} style={{ display: "contents" }} inert={showingPreview} aria-hidden={showingPreview || undefined}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/portfolio"
          element={
            <>
              <HeaderNav />
              <InfiniteDragGrid />
            </>
          }
        />
        <Route path="/portfolio/:id" element={<ProjectDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/editorial" element={<Editorial />} />
        <Route path="/sketches" element={<Sketches key={preview ? "preview" : "normal"} loaderPreview={preview} />} />
      </Routes>
      </div>
      {preview && <SketchbookLoaderPreview key={location.key} pageRef={pageRef} onStart={startPreview} onDone={finishPreview} />}
      <RouteCommitSignal />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RoutedContent />
    </BrowserRouter>
  );
}

export default App;
