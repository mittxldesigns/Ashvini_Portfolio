import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <>
      {/* Black overlay that fades in then out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 1 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "#0E0E0E",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />

      {/* Page content that fades in after overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
          delay: 0.2,
        }}
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
