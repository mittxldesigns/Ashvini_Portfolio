import HeaderNav from "./HeaderNav.jsx";
import batla from "../assets/z6reg6szut7ouitceg1h.avif";

function About() {
  return (
    <>
      <HeaderNav />
      <div className="about-page">
        <img className="about-avatar" src={batla} alt="Ashwani Kumar" />
        <h1>Ashwani Kumar</h1>
        <p className="about-title">Top 1% Spline Expert on Contra</p>

        <div className="about-stats">
          <div>
            <strong>4.86★</strong>
            <span>14 reviews</span>
          </div>
          <div>
            <strong>13+</strong>
            <span>projects shipped</span>
          </div>
          <div>
            <strong>India</strong>
            <span>based, remote</span>
          </div>
        </div>

        <p className="para about-bio">
          I'm a 3D artist and Spline designer focused on crafting intuitive,
          high-performance 3D experiences for the web. From hard-surface
          product modeling to scroll-interactive hero sections, I build
          assets that stay lightweight without giving up detail — work
          shipped for brands like HeyGen, Athletic Power, and Mebrafino.
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

        <div className="detail-actions">
          <a
            className="cta"
            href="https://contra.com/ashvini_kmr?r=mittxldesigns"
            target="_blank"
            rel="noreferrer"
          >
            Hire me on Contra
          </a>
          <a
            className="cta cta-outline"
            href="https://instagram.com/ashvini_kmr"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </div>
      </div>
    </>
  );
}

export default About;
