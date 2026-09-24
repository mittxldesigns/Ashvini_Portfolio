import { Link, useParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import { getProjectById } from "../data/projects.js";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = getProjectById(id);

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

  return (
    <>
      <HeaderNav />
      <div className="detail-page">
        <img
          className="detail-cover"
          src={project.image}
          alt={project.title}
        />
        <h1>{project.title}</h1>
        <p className="para detail-description">{project.description}</p>

        <div className="detail-meta">
          <div>
            <span className="detail-label">Role</span>
            <span>{project.roles.join(", ")}</span>
          </div>
          <div>
            <span className="detail-label">Tools</span>
            <span>{project.tools.join(", ")}</span>
          </div>
          <div>
            <span className="detail-label">Outcome</span>
            <span>{project.outcome}</span>
          </div>
        </div>

        <div className="detail-actions">
          {project.externalLink && (
            <a
              className="cta"
              href={project.externalLink}
              target="_blank"
              rel="noreferrer"
            >
              View Spline Scene
            </a>
          )}
          <a
            className="cta cta-outline"
            href={project.contraUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Case Study on Contra
          </a>
        </div>

        <Link className="back-link" to="/portfolio">
          ← Back to portfolio
        </Link>
      </div>
    </>
  );
}
