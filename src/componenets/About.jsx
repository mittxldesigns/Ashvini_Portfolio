import HeaderNav from "./HeaderNav.jsx";
import { caseStudies, projects } from "../data/projects.js";

const batla = "/avatar.webp";

function About() {
  return (
    <>
      <HeaderNav />
      <div className="about-page">
        <div className="about-intro">
          <img className="about-avatar" src={batla} alt="Ashvini Kumar" />
          <h1>Ashvini Kumar</h1>
          <p className="about-title">Top 1% Spline Expert on Contra</p>

          <div className="about-stats">
            <div>
              <strong>4.86★</strong>
              <span>Contra rating</span>
            </div>
            <div>
              <strong>{projects.length}</strong>
              <span>selected works</span>
            </div>
            <div>
              <strong>India</strong>
              <span>based, remote</span>
            </div>
          </div>
        </div>

        <div className="about-main">
          <p className="para about-bio">
            I build product models and interactive 3D scenes for the web.
            Selected projects include backgrounds for HeyGen, bottle models
            for Athletic Power, and a scroll-driven visual experience for
            Mebrafino.
          </p>

          <div className="about-skills">
            <span>Spline</span>
            <span>Blender</span>
            <span>Autodesk 3ds Max</span>
            <span>V-Ray</span>
            <span>ZBrush</span>
            <span>Framer</span>
            <span>Webflow</span>
          </div>

          <div className="case-studies">
            <h2>More work</h2>
            {caseStudies.map((c) => (
              <a key={c.url} href={c.url} target="_blank" rel="noreferrer">
                <span>{c.title}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>

          <div className="detail-actions">
            <a
              className="cta"
              href="https://contra.com/ashvini_kmr?r=mittxldesigns"
              target="_blank"
              rel="noreferrer"
            >
              Message Ashvini on Contra
            </a>
            <a
              className="cta cta-outline"
              href="https://instagram.com/ashvini_kmr"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a
              className="cta cta-outline"
              href="https://community.spline.design/bettercallashvini"
              target="_blank"
              rel="noreferrer"
            >
              Spline Community
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default About;
