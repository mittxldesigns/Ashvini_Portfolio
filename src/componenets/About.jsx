import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { caseStudies, projects } from "../data/projects.js";
import { getSiteProfile } from "../data/siteProfile.js";

const batla = "/avatar.webp";

function About() {
  const profile = getSiteProfile();
  const timeline = profile.experience;
  const faq = profile.faq;
  return (
    <>
      <HeaderNav />
      <div className="about-page">
        <div className="about-intro">
          <img className="about-avatar" src={profile.avatarUrl || batla} alt={profile.name} />
          <h1>{profile.name}</h1>
          <p className="about-title">{profile.aboutTitle}</p>

          <div className="about-stats">
            <div>
              <strong>{profile.rating}</strong>
              <span>Contra rating</span>
            </div>
            <div>
              <strong>{projects.length}</strong>
              <span>selected works</span>
            </div>
            <div>
              <strong>{profile.location}</strong>
              <span>based, remote</span>
            </div>
          </div>
        </div>

        <div className="about-main">
          <p className="para about-bio">
            {profile.aboutBio}
          </p>

          <div className="about-sides">
            <TransitionLink to="/portfolio">
              <span>3D &amp; Web3D</span>
              <strong>Product models and interactive scenes for the web.</strong>
              <em>Spline · Blender · 3ds Max →</em>
            </TransitionLink>
            <TransitionLink to="/editorial">
              <span>Social &amp; editorial</span>
              <strong>Six years of covers, thumbnails and posts for pop-culture publishers.</strong>
              <em>FandomWire · Animated Times →</em>
            </TransitionLink>
            <TransitionLink className="about-sketches" to="/sketches">
              <span>Sketchbook</span>
              <strong>Film posters, character studies, pencil and ink.</strong>
              <em>Photoshop · graphite · ink →</em>
            </TransitionLink>
          </div>

          <div className="about-experience">
            <h2>Experience</h2>
            <ol>
              {timeline.map((t) => (
                <li key={t.org + t.years} className={`about-exp-${t.side}`}>
                  <span className="about-exp-years">{t.years}</span>
                  <div>
                    <strong>{t.role}</strong> <span className="about-exp-org">· {t.org}</span>
                    {t.note && <p>{t.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="about-skills">
            {profile.skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>

          <div className="about-faq">
            <h2>Quick answers</h2>
            {faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>

          <div className="case-studies">
            <h2>More work</h2>
            {(profile.caseStudies || caseStudies).map((c) => (
              <a key={c.url} href={c.url} target="_blank" rel="noreferrer">
                <span>{c.title}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>

          <div className="detail-actions">
            <a
              className="cta"
              href={profile.contraUrl}
              target="_blank"
              rel="noreferrer"
            >
              Message Ashvini on Contra
            </a>
            <a
              className="cta cta-outline"
              href={profile.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a
              className="cta cta-outline"
              href={profile.splineUrl}
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
