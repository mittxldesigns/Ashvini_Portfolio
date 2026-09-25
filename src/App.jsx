import { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import InfiniteDragGrid from "./componenets/InfiniteDragGrid.jsx";
import Home from "./componenets/Home.jsx";
import HeaderNav from "./componenets/HeaderNav.jsx";
import About from "./componenets/About.jsx";
import ProjectDetail from "./componenets/ProjectDetail.jsx";
import { notifyRouteCommit } from "./lib/viewTransition.js";

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
function App() {
  return (
    <BrowserRouter>
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
      </Routes>
      <RouteCommitSignal />
    </BrowserRouter>
  );
}

export default App;
