import { useEffect, useRef } from "react";
import { transitionsSettled } from "../lib/viewTransition.js";

// Live Spline scenes are heavy (runtime + WASM + scene file), so only load
// them where they'll run well: fine pointer, enough memory, no data saver,
// motion allowed. Everyone else keeps the static render.
function canRunLive() {
  const mq = (q) => window.matchMedia(q).matches;
  if (mq("(max-width: 900px)")) return false;
  if (!mq("(hover: hover) and (pointer: fine)")) return false;
  if (mq("(prefers-reduced-motion: reduce)")) return false;
  if (navigator.connection?.saveData) return false;
  if ((navigator.deviceMemory ?? 8) < 4) return false;
  return true;
}

const idle = () =>
  new Promise((resolve) =>
    "requestIdleCallback" in window
      ? requestIdleCallback(resolve, { timeout: 1200 })
      : setTimeout(resolve, 300)
  );

const IDLE_PAUSE_MS = 8_000;

function capSplineResolution(app) {
  const renderer = app._renderer;
  const pixelRatio = renderer?.getPixelRatio?.();
  if (Number.isFinite(pixelRatio) && pixelRatio > 1.5) {
    renderer.setPixelRatio(1.5);
    app.requestRender();
  }
}

function waitForVisible(signal) {
  if (signal.aborted) return Promise.resolve(false);
  if (!document.hidden) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (visible) => {
      document.removeEventListener("visibilitychange", check);
      signal.removeEventListener("abort", abort);
      resolve(visible);
    };
    const check = () => { if (!document.hidden) finish(true); };
    const abort = () => finish(false);
    document.addEventListener("visibilitychange", check);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function pauseWhileHidden(app, signal) {
  if (!document.hidden) return true;
  app.stop();
  const visible = await waitForVisible(signal);
  if (visible) app.play();
  return visible;
}

function waitForRenderedFrame(canvas, app, signal) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let timeout;
    const finish = (ready) => {
      canvas.removeEventListener("rendered", rendered);
      signal.removeEventListener("abort", abort);
      clearTimeout(timeout);
      resolve(ready);
    };
    const rendered = () => {
      if (app._renderer?.lastFrameIncomplete) return;
      finish(true);
    };
    const abort = () => finish(false);
    canvas.addEventListener("rendered", rendered);
    signal.addEventListener("abort", abort, { once: true });
    timeout = setTimeout(() => finish(false), 10_000);
    app.requestRender();
  });
}

function waitForPaint(signal) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let firstFrame;
    let secondFrame;
    const finish = (ready) => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      signal.removeEventListener("abort", abort);
      resolve(ready);
    };
    const abort = () => finish(false);
    signal.addEventListener("abort", abort, { once: true });
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => finish(true));
    });
  });
}

function pauseWhenInactive(app, canvas) {
  let inView = true;
  let playing = true;
  let lastActivity = performance.now();
  let idleTimer;

  const sync = () => {
    const shouldPlay = !document.hidden && inView &&
      performance.now() - lastActivity < IDLE_PAUSE_MS;
    if (shouldPlay === playing) return;
    playing = shouldPlay;
    if (shouldPlay) app.play();
    else app.stop();
  };
  const armIdle = () => {
    clearTimeout(idleTimer);
    if (!document.hidden && inView) {
      const remaining = Math.max(0, IDLE_PAUSE_MS - (performance.now() - lastActivity));
      idleTimer = setTimeout(sync, remaining);
    }
  };
  const activity = () => {
    const now = performance.now();
    if (playing && now - lastActivity < 750) return;
    lastActivity = now;
    sync();
    armIdle();
  };
  const visibility = () => {
    if (!document.hidden) lastActivity = performance.now();
    sync();
    armIdle();
  };
  const observer = new IntersectionObserver(([entry]) => {
    const wasInView = inView;
    inView = entry.isIntersecting;
    if (inView && !wasInView) lastActivity = performance.now();
    sync();
    armIdle();
  }, { threshold: 0.01 });

  observer.observe(canvas);
  window.addEventListener("pointermove", activity, { passive: true });
  window.addEventListener("pointerdown", activity, { passive: true });
  window.addEventListener("keydown", activity);
  window.addEventListener("scroll", activity, { capture: true, passive: true });
  document.addEventListener("visibilitychange", visibility);
  visibility();

  return () => {
    clearTimeout(idleTimer);
    observer.disconnect();
    window.removeEventListener("pointermove", activity);
    window.removeEventListener("pointerdown", activity);
    window.removeEventListener("keydown", activity);
    window.removeEventListener("scroll", activity, true);
    document.removeEventListener("visibilitychange", visibility);
  };
}

function prepareScene(app) {
  const hiddenNames = /(?:spline|logo|badge|credit|attribution)/i;
  for (const object of app.getAllObjects()) {
    const record = app._data?.scene?.objects?.get?.(object.uuid);
    const geometry = record?.data?.geometry;
    const isText = geometry?.type === "TextGeometry";
    const isFlatTextLikeVector =
      geometry?.type === "SubdivGeometry" &&
      geometry.depth === 0 &&
      geometry.width <= 60 &&
      geometry.height <= 24 &&
      (geometry.positionWASM?.length ?? 0) >= 300;
    if (isText || isFlatTextLikeVector || hiddenNames.test(object.name)) {
      object.visible = false;
    }
  }

  const pipeline = app._renderer?.pipeline;
  if (pipeline?.setWatermark) pipeline.setWatermark(null);
  else if (pipeline?.logoOverlayPass) pipeline.logoOverlayPass.enabled = false;
  app.requestRender();
}

function fitSplineCamera(app, url) {
  const sceneCamera = app._camera;
  const cameraData = sceneCamera?.data;
  const quaternion = sceneCamera?.quaternion?.toArray?.();
  if (!cameraData || !quaternion) return;

  const meshes = [];
  for (const object of app.getAllObjects()) {
    if (!object.visible) continue;
    const entity = app._scene?.find?.(object.uuid);
    if (!entity?.geometry) continue;
    try {
      const vertices = [];
      for (const vertex of entity.singleBBox.vertices) {
        const point = vertex.toArray();
        if (point.every(Number.isFinite)) vertices.push(point);
      }
      if (vertices.length) meshes.push({ object, name: object.name, vertices });
    } catch {
      // A scene helper without a measurable geometry does not affect framing.
    }
  }
  if (meshes.length === 0) return;

  const [qx, qy, qz, qw] = quaternion;
  const rotate = ([x, y, z]) => {
    const tx = 2 * (qy * z - qz * y);
    const ty = 2 * (qz * x - qx * z);
    const tz = 2 * (qx * y - qy * x);
    return [
      x + qw * tx + qy * tz - qz * ty,
      y + qw * ty + qz * tx - qx * tz,
      z + qw * tz + qx * ty - qy * tx,
    ];
  };
  const right = rotate([1, 0, 0]);
  const up = rotate([0, 1, 0]);
  const forward = rotate([0, 0, -1]);
  const dot = (point, basis) => point.reduce((sum, value, axis) => sum + value * basis[axis], 0);
  const measuredMeshes = meshes.map((mesh) => {
    const horizontal = mesh.vertices.map((point) => dot(point, right));
    const vertical = mesh.vertices.map((point) => dot(point, up));
    const width = Math.max(...horizontal) - Math.min(...horizontal);
    const height = Math.max(...vertical) - Math.min(...vertical);
    return { ...mesh, span: Math.hypot(width, height) };
  });
  const isRectangle = (mesh) => /^Rectangle(?:\s|$)/i.test(mesh.name);
  const largestModelSpan = Math.max(0, ...measuredMeshes.filter((mesh) => !isRectangle(mesh)).map((mesh) => mesh.span));
  const oversizedRectangles = measuredMeshes.filter((mesh) =>
    isRectangle(mesh) && largestModelSpan > 0 && mesh.span > largestModelSpan * 4
  );
  const hasBackdrop = oversizedRectangles.length >= 2 ||
    oversizedRectangles.some((mesh) => mesh.span > largestModelSpan * 8);
  if (hasBackdrop) {
    for (const mesh of oversizedRectangles) mesh.object.visible = false;
  }
  const framingMeshes = hasBackdrop
    ? measuredMeshes.filter((mesh) => !oversizedRectangles.includes(mesh))
    : measuredMeshes;
  const points = framingMeshes.flatMap((mesh) => mesh.vertices);
  const extent = (basis) => {
    const values = points.map((point) => dot(point, basis));
    return [Math.min(...values), Math.max(...values)];
  };
  const [minRight, maxRight] = extent(right);
  const [minUp, maxUp] = extent(up);
  const [minDepth, maxDepth] = extent(forward);
  const projectedWidth = maxRight - minRight;
  const projectedHeight = maxUp - minUp;
  if (!(projectedWidth > 0 && projectedHeight > 0)) return;
  const center = right.map((value, axis) =>
    value * (minRight + maxRight) / 2 +
    up[axis] * (minUp + maxUp) / 2 +
    forward[axis] * (minDepth + maxDepth) / 2
  );
  const targetDistance = cameraData.targetOffset || sceneCamera.targetOffset || 1000;
  const aspect = Math.max(projectedWidth / projectedHeight, projectedHeight / projectedWidth);
  const margin = aspect > 1.6 ? 0.66 : 0.78;

  cameraData.position = center.map((value, axis) => value - forward[axis] * targetDistance);
  if (cameraData.type === "OrthographicCamera" && sceneCamera.orthoCamera) {
    const fittedZoom = margin * Math.min(
      (sceneCamera.right - sceneCamera.left) / projectedWidth,
      (sceneCamera.top - sceneCamera.bottom) / projectedHeight
    );
    cameraData.orthographic.zoom = url.includes("3vQwrcy4RfqSLaaZ")
      ? fittedZoom * 1.25
      : fittedZoom;
    sceneCamera.updateCameraState(cameraData);
    sceneCamera.orthoCamera.updateProjectionMatrix();
  } else if (cameraData.type === "PerspectiveCamera" && sceneCamera.perspCamera) {
    const radius = Math.hypot(projectedWidth / 2, projectedHeight / 2, (maxDepth - minDepth) / 2);
    const halfFov = (cameraData.perspective.fov * Math.PI) / 360;
    const fittedDistance = radius / (Math.sin(halfFov) * margin);
    cameraData.targetOffset = fittedDistance;
    cameraData.position = center.map((value, axis) => value - forward[axis] * fittedDistance);
    sceneCamera.updateCameraState(cameraData);
    sceneCamera.perspCamera.updateProjectionMatrix();
  } else return;

  sceneCamera.updateMatrixWorld(true);
  app.requestRender();
}

/**
 * Loads a Spline code export into a transparent canvas once any page
 * transition has settled, then calls onLive(true) so the static render can
 * crossfade out. Disposes the runtime on unmount / scene change.
 */
export default function LiveScene({ url, onLive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url || !canRunLive()) return;
    let cancelled = false;
    let app = null;
    let resizeObserver = null;
    let resizeFrame;
    let settledResizeFrame;
    let stopWatchingActivity = null;
    const abortController = new AbortController();
    const canvas = canvasRef.current;
    const contextLost = (event) => {
      event.preventDefault();
      onLive(false);
      stopWatchingActivity?.();
      stopWatchingActivity = null;
      app?.stop();
    };
    canvas.addEventListener("webglcontextlost", contextLost);

    (async () => {
      await transitionsSettled();
      await idle();
      if (cancelled || !(await waitForVisible(abortController.signal))) return;
      const { Application } = await import("@splinetool/runtime");
      if (cancelled) return;
      app = new Application(canvasRef.current, {
        renderMode: "auto",
        renderer: "webgl",
        htmlContentMode: "none",
      });
      await app.load(url);
      if (cancelled) return;
      if (!(await pauseWhileHidden(app, abortController.signal))) return;
      capSplineResolution(app);
      prepareScene(app);
      app.setGlobalEvents(true);
      const fitScene = () => fitSplineCamera(app, url);
      const scheduleFit = () => {
        cancelAnimationFrame(resizeFrame);
        cancelAnimationFrame(settledResizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          settledResizeFrame = requestAnimationFrame(fitScene);
        });
      };
      resizeObserver = new ResizeObserver(scheduleFit);
      resizeObserver.observe(canvasRef.current.parentElement);
      if (!(await waitForPaint(abortController.signal))) return;
      fitScene();
      app.setBackgroundColor("transparent");
      const ready = await waitForRenderedFrame(canvasRef.current, app, abortController.signal);
      if (!ready) throw new Error("Spline did not render a complete frame");
      if (!(await pauseWhileHidden(app, abortController.signal))) return;
      if (!(await waitForPaint(abortController.signal)) || cancelled) return;
      onLive(true);
      stopWatchingActivity = pauseWhenInactive(app, canvasRef.current);
    })().catch((err) => {
      if (!cancelled) {
        console.warn("Live scene unavailable:", err);
        resizeObserver?.disconnect();
        cancelAnimationFrame(resizeFrame);
        cancelAnimationFrame(settledResizeFrame);
        app?.dispose();
        app = null;
      }
    });

    return () => {
      cancelled = true;
      abortController.abort();
      onLive(false);
      stopWatchingActivity?.();
      canvas.removeEventListener("webglcontextlost", contextLost);
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(settledResizeFrame);
      app?.dispose();
    };
  }, [url, onLive]);

  if (!url) return null;
  return <canvas ref={canvasRef} className={`project-live${url.includes("3vQwrcy4RfqSLaaZ") ? " project-live--dna" : ""}`} />;
}
