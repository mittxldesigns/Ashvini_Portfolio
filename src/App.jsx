import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import InfiniteDragGrid from "./componenets/InfiniteDragGrid.jsx";
import Home from "./componenets/home.jsx";
import PageTransition from "./componenets/PageTransition.jsx";
import HeaderNav from "./componenets/HeaderNav.jsx";
import About from "./componenets/About.js";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/portfolio"
          element={
            <PageTransition>
              <HeaderNav />
              <InfiniteDragGrid />
            </PageTransition>
          }
        />
        <Route
          path="/portfolio/:id"
          element={
            <PageTransition>
              <HeaderNav />
              <div>Detail Page</div>
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition>
              <About />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
