import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import ProjectStrip from "./ProjectStrip.jsx";
import TransitionLink from "./TransitionLink.jsx";
import {
  projects,
  getProjectById,
  decodeThumb,
  preloadHero,
} from "../data/projects.js";
import { gridState } from "../lib/gridState.js";
import {
  isViewTransitionRunning,
  withViewTransition,
} from "../lib/viewTransition.js";

const pad = (n) => String(n).padStart(2, "0");

const linkLabel = (url) =>
  url.includes("community.spline.design")
    ? "Open in Spline Community"
    : url.includes("spline.design")
      ? "View Spline Scene"
      : "Visit Site";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = getProjectById(id);
  const [heroLoadedId, setHeroLoadedId] = useState(null);
  // Arriving via the shared-element transition: the hero is already flying
  // into place, so skip its own entrance animation.
  const [arrivedByMorph] = useState(isViewTransitionRunning);
  const stageRef = useRef(null);

  const index = projects.findIndex((p) => p.id === project?.id);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  const select = useCallback(
    (nextId) => {
      const target = getProjectById(nextId);
      withViewTransition(
        "swap",
        () => navigate(`/portfolio/${nextId}`, { replace: true }),
        () => decodeThumb(target)
      );
    },
    [navigate]
  );

  const close = useCallback(() => {
    gridState.returnToId = project?.id ?? null;
    withViewTransition("close", () => navigate("/portfolio"));
  }, [navigate, project?.id]);

  useEffect(() => {
    if (!project) return;
    preloadHero(prev);
    preloadHero(next);
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") select(next.id);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") select(prev.id);
      else if (e.key === "Escape") close();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, prev, next, select, close]);

  // Gentle parallax tilt on the render, following the pointer.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        stage.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
        stage.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      stage.style.setProperty("--ry", "0deg");
      stage.style.setProperty("--rx", "0deg");
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  if (!project) {
    return (
      <>
        <HeaderNav />
        <div className="project project-missing">
          <p className="para">Project not found.</p>
          <TransitionLink className="cta" to="/portfolio">
            Back to all work
          </TransitionLink>
        </div>
      </>
    );
  }

  const isCaseStudy = project.roles.length > 0;
  const meta = [
    ["Role", project.roles.join(", ")],
    ["Tools", project.tools.join(", ")],
    ["Outcome", project.outcome],
  ].filter(([, value]) => value);

  return (
    <>
      <HeaderNav />
      <div className="project">
        <ProjectStrip activeId={project.id} onSelect={select} />

        <section className="project-info" key={project.id}>
          <a
            className="project-back reveal"
            href="/portfolio"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              close();
            }}
          >
            ← All work
          </a>
          <p className="project-index reveal" style={{ "--d": "40ms" }}>
            {pad(index + 1)} <span>/ {pad(projects.length)}</span>
          </p>
          <h1 className="project-title reveal" style={{ "--d": "90ms" }}>
            {project.title}
          </h1>
          <p className="project-desc reveal" style={{ "--d": "140ms" }}>
            {project.description}
          </p>

          {meta.length > 0 && (
            <dl className="project-meta reveal" style={{ "--d": "190ms" }}>
              {meta.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="project-actions reveal" style={{ "--d": "240ms" }}>
            {project.externalLink && (
              <a
                className="cta"
                href={project.externalLink}
                target="_blank"
                rel="noreferrer"
              >
                {linkLabel(project.externalLink)}
              </a>
            )}
            {project.extraLinks.map((l) => (
              <a
                key={l.url}
                className="cta cta-outline"
                href={l.url}
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            ))}
            <a
              className={isCaseStudy ? "cta cta-outline" : "cta"}
              href={project.contraUrl}
              target="_blank"
              rel="noreferrer"
            >
              {isCaseStudy ? "Case Study on Contra" : "More work on Contra"}
            </a>
          </div>

          <div className="project-pager reveal" style={{ "--d": "290ms" }}>
            <button type="button" onClick={() => select(prev.id)}>
              ↑ <span>{prev.title}</span>
            </button>
            <button type="button" onClick={() => select(next.id)}>
              ↓ <span>{next.title}</span>
            </button>
          </div>
        </section>

        <div className="project-stage" ref={stageRef}>
          <div className="project-glow" />
          <div
            className={arrivedByMorph ? "project-hero" : "project-hero is-intro"}
            style={{ viewTransitionName: "hero" }}
          >
            <div className="project-hero-motion">
              <picture key={`thumb-${project.id}`}>
                <source srcSet={project.thumbAvif} type="image/avif" />
                <img
                  className="project-hero-thumb"
                  src={project.thumbWebp}
                  alt=""
                  draggable={false}
                />
              </picture>
              <picture key={project.id}>
                <source srcSet={project.heroAvif} type="image/avif" />
                <img
                  className={
                    heroLoadedId === project.id
                      ? "project-hero-full is-loaded"
                      : "project-hero-full"
                  }
                  src={project.heroWebp}
                  alt={project.title}
                  draggable={false}
                  decoding="async"
                  onLoad={() => setHeroLoadedId(project.id)}
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
