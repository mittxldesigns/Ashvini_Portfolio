import { BrowserRouter, Routes, Route } from "react-router-dom";

import InfiniteDragGrid from "./componenets/InfiniteDragGrid.jsx";
import Home from "./componenets/Home.jsx";
import HeaderNav from "./componenets/HeaderNav.jsx";
import About from "./componenets/About.jsx";
import ProjectDetail from "./componenets/ProjectDetail.jsx";

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
    </BrowserRouter>
  );
}

export default App;
