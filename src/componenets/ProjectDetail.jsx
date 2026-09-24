import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import { getProjectById, thumbSrc } from "../data/projects.js";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = getProjectById(id);
  const [loaded, setLoaded] = useState(false);

  if (!project) {
    return (
      <>
        <HeaderNav />
        <div className="detail-page">
          <p className="para">Project not found.</p>
          <Link className="cta" to="/portfolio">
            Back to portfolio
          </Link>
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
      <div className="detail-page">
        <div
          className="detail-cover-wrap"
          style={
            loaded ? undefined : { backgroundImage: `url(${thumbSrc(project)})` }
          }
        >
          <img
            className={`detail-cover${loaded ? " is-loaded" : ""}`}
            src={project.image}
            alt={project.title}
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </div>
        <h1 className="reveal" style={{ "--d": "80ms" }}>
          {project.title}
        </h1>
        <p
          className="para detail-description reveal"
          style={{ "--d": "160ms" }}
        >
          {project.description}
        </p>

        {meta.length > 0 && (
          <div className="detail-meta reveal" style={{ "--d": "240ms" }}>
            {meta.map(([label, value]) => (
              <div key={label}>
                <span className="detail-label">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="detail-actions reveal" style={{ "--d": "320ms" }}>
          {project.externalLink && (
            <a
              className="cta"
              href={project.externalLink}
              target="_blank"
              rel="noreferrer"
            >
              {project.externalLink.includes("spline.design")
                ? "View Spline Scene"
                : "Visit Site"}
            </a>
          )}
          <a
            className={isCaseStudy ? "cta cta-outline" : "cta"}
            href={project.contraUrl}
            target="_blank"
            rel="noreferrer"
          >
            {isCaseStudy ? "View Case Study on Contra" : "More work on Contra"}
          </a>
        </div>

        <Link className="back-link" to="/portfolio">
          ← Back to portfolio
        </Link>
      </div>
    </>
  );
}
