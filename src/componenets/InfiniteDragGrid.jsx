import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { projects } from "../data/projects.js";

const TILE_SIZE = 220;
const GAP = 100;
const GRID_SIZE = 7; // Reduced further for smoother performance

export default function InfiniteDragGrid() {
  const gridRef = useRef(null);
  const navigate = useNavigate();
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animationFrame = useRef(null);

  // Memoize tiles so they don't re-render
  const tiles = useMemo(() => {
    const result = [];

    // Only create 3x3 repetition for seamless wrapping
    for (let repeatY = -1; repeatY <= 1; repeatY++) {
      for (let repeatX = -1; repeatX <= 1; repeatX++) {
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            const index = (row * GRID_SIZE + col) % projects.length;
            const item = projects[index];

            const x = (repeatX * GRID_SIZE + col) * (TILE_SIZE + GAP);
            const y = (repeatY * GRID_SIZE + row) * (TILE_SIZE + GAP);

            result.push(
              <div
                key={`${repeatX}-${repeatY}-${row}-${col}`}
                className="tile"
                style={{
                  position: "absolute",
                  left: `${x}px`,
                  top: `${y}px`,
                  willChange: "auto",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDragging.current) navigate(`/portfolio/${item.id}`);
                }}
              >
                <img src={item.image} alt={item.title} draggable={false} />
              </div>
            );
          }
        }
      }
    }

    return result;
  }, [navigate]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const totalSize = GRID_SIZE * (TILE_SIZE + GAP);

    // Lock scroll
    const blockScroll = (e) => e.preventDefault();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    // Apply transform with wrapping
    const updateTransform = () => {
      // Wrap position to create infinite effect
      const wrappedX =
        ((position.current.x % totalSize) + totalSize) % totalSize;
      const wrappedY =
        ((position.current.y % totalSize) + totalSize) % totalSize;
      grid.style.transform = `translate3d(${wrappedX}px, ${wrappedY}px, 0)`;
    };

    // Momentum animation
    const animate = () => {
      if (
        !isDragging.current &&
        (Math.abs(velocity.current.x) > 0.1 ||
          Math.abs(velocity.current.y) > 0.1)
      ) {
        position.current.x += velocity.current.x;
        position.current.y += velocity.current.y;

        // Dynamic blur based on velocity
        const speed = Math.sqrt(
          velocity.current.x ** 2 + velocity.current.y ** 2
        );
        const blurAmount = Math.min(speed * 0.3, 4);
        grid.style.filter = `blur(${blurAmount}px)`;

        // Strong resistance
        velocity.current.x *= 0.92;
        velocity.current.y *= 0.92;

        // Stop when very slow
        if (Math.abs(velocity.current.x) < 0.1) velocity.current.x = 0;
        if (Math.abs(velocity.current.y) < 0.1) velocity.current.y = 0;

        // Clear blur when stopped
        if (velocity.current.x === 0 && velocity.current.y === 0) {
          grid.style.filter = "blur(0px)";
        }

        updateTransform();
      }
      animationFrame.current = requestAnimationFrame(animate);
    };
    animate();

    // Mouse/Touch handlers
    const handleStart = (e) => {
      isDragging.current = true;
      velocity.current = { x: 0, y: 0 };

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      dragStart.current = {
        x: clientX - position.current.x,
        y: clientY - position.current.y,
      };

      lastPos.current = { x: clientX, y: clientY };
      lastTime.current = Date.now();

      document.body.style.cursor = "grabbing";
      grid.style.cursor = "grabbing";
      grid.style.filter = "blur(3px)";
      grid.style.transition = "filter 0.1s ease";
    };

    const handleMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const now = Date.now();
      const dt = now - lastTime.current;

      position.current = {
        x: clientX - dragStart.current.x,
        y: clientY - dragStart.current.y,
      };

      // Calculate velocity
      if (dt > 0) {
        velocity.current = {
          x: ((clientX - lastPos.current.x) / dt) * 16,
          y: ((clientY - lastPos.current.y) / dt) * 16,
        };
      }

      lastPos.current = { x: clientX, y: clientY };
      lastTime.current = now;

      updateTransform();
    };

    const handleEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = "grab";
      grid.style.cursor = "grab";
      grid.style.filter = "blur(0px)";

      // Limit max velocity
      const maxVel = 15;
      velocity.current.x = Math.max(
        -maxVel,
        Math.min(maxVel, velocity.current.x)
      );
      velocity.current.y = Math.max(
        -maxVel,
        Math.min(maxVel, velocity.current.y)
      );

      setTimeout(() => {
        if (!isDragging.current) {
          isDragging.current = false;
        }
      }, 150);
    };

    // Add event listeners
    window.addEventListener("mousedown", handleStart);
    window.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);

    // Set initial cursor
    document.body.style.cursor = "grab";
    grid.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(animationFrame.current);
      window.removeEventListener("mousedown", handleStart);
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
      document.body.style.overflow = "";
      document.body.style.cursor = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
    };
  }, []);

  return (
    <div className="viewport">
      <div
        ref={gridRef}
        className="grid"
        style={{ position: "absolute", willChange: "transform" }}
      >
        {tiles}
      </div>
    </div>
  );
}
