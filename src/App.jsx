import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";

import InfiniteDragGrid from "./componenets/InfiniteDragGrid.jsx";
import Home from "./componenets/Home.jsx";
import PageTransition from "./componenets/PageTransition.jsx";
import HeaderNav from "./componenets/HeaderNav.jsx";
import About from "./componenets/About.jsx";
import ProjectDetail from "./componenets/ProjectDetail.jsx";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
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
              <ProjectDetail />
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
    <LazyMotion features={domAnimation} strict>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </LazyMotion>
  );
}

export default App;
