import { useCallback, useEffect, useRef, useState } from "react";
import "./PortfolioAdmin.css";

const OWNER_EMAIL = "kumarak9335@gmail.com";
const EMPTY = { schemaVersion: 1, revision: 0, profile: {}, projects: [], editorial: [], sketches: [] };
const COLLECTIONS = ["profile", "projects", "editorial", "sketches"];
const PROFILE_TEXT = [
  ["name", "Name"], ["location", "Location"], ["rating", "Verified rating label"], ["avatarUrl", "Profile image path"], ["tagline", "Tagline"], ["homeDescription", "Home introduction"],
  ["homeCred", "Home credibility line"], ["aboutTitle", "About heading"], ["aboutBio", "About biography"],
  ["contraUrl", "Contra URL"], ["instagramUrl", "Instagram URL"], ["linkedinUrl", "LinkedIn URL"], ["splineUrl", "Spline URL"],
  ["editorialTitle", "Editorial heading"], ["editorialIntro", "Editorial introduction"], ["editorialYearsLabel", "Editorial experience label"],
  ["editorialPubsTitle", "Publisher section heading"], ["editorialPubsNote", "Publisher section note"], ["editorialClosingNote", "Editorial closing note"],
  ["sketchesKicker", "Sketchbook label"], ["sketchesIntro", "Sketchbook introduction"], ["sketchesClosingNote", "Sketchbook closing note"],
];
const ROW_TEXT = [
  ["title", "Title"], ["slug", "URL name"], ["description", "Description"], ["note", "Caption / note"],
  ["client", "Client"], ["date", "Date"], ["dateLabel", "Displayed date (when the year is unknown)"], ["url", "Source URL"], ["medium", "Medium"], ["platform", "Platform"], ["contentWarning", "Sensitive-content warning"],
];
function FormField({ label, value, onChange, multiline = false, type = "text", disabled = false }) {
  return <label className="cms-field"><span>{label}</span>{multiline
    ? <textarea aria-label={label} value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={4} disabled={disabled} />
    : <input aria-label={label} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} />}</label>;
}
function ArrayEditor({ label, value, fields, onChange }) {
  const rows = Array.isArray(value) ? value : [];
  return <fieldset className="cms-array"><legend>{label}</legend>{rows.map((row, index) => <div className="cms-array-row" key={index}>
    {fields.map(([key, title, type]) => <FormField key={key} label={title} value={row[key]} type={type || "text"} onChange={(next) => onChange(rows.map((entry, i) => i === index ? { ...entry, [key]: type === "number" ? Number(next) : next } : entry))} />)}
    <button type="button" className="cms-text-button" onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove entry</button>
  </div>)}<button type="button" onClick={() => onChange([...rows, Object.fromEntries(fields.map(([key]) => [key, ""]))])}>Add entry</button></fieldset>;
}
async function previewBlob(file) {
  const url = URL.createObjectURL(file);
  try {
    const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not create an upload preview.");
    let source, width, height;
    if (file.type.startsWith("video/")) {
      source = document.createElement("video"); source.preload = "auto"; source.muted = true; source.playsInline = true;
      await new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("The video preview timed out. Try an MP4 or WebM file.")), 20000);
        source.onloadeddata = () => { clearTimeout(timer); resolve(); };
        source.onerror = () => { clearTimeout(timer); reject(new Error("The video format could not be opened. Try MP4 or WebM.")); };
        source.src = url;
      });
      width = source.videoWidth; height = source.videoHeight;
    } else {
      source = new Image(); source.src = url; await source.decode(); width = source.naturalWidth; height = source.naturalHeight;
    }
    if (!width || !height) throw new Error("The file has no usable image dimensions.");
    const scale = Math.min(1, 1000 / Math.max(width, height)); canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) throw new Error("The preview could not be created.");
    return { blob, width, height };
  } finally { URL.revokeObjectURL(url); }
}

function consumeSetupFragment() {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("setup") || "";
  if (!/^[a-f0-9]{64}$/.test(value)) return "";
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return value;
}

export default function PortfolioAdmin({ initialContent = EMPTY }) {
  const [session, setSession] = useState(null), [content, setContent] = useState(initialContent);
  const [revision, setRevision] = useState(0), [publishedRevision, setPublishedRevision] = useState(null);
  const [history, setHistory] = useState([]), [section, setSection] = useState("profile"), [selected, setSelected] = useState(0);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [setupToken, setSetupToken] = useState(consumeSetupFragment);
  const emailRef = useRef(null), passwordRef = useRef(null), fileRef = useRef(null);
  const request = useCallback(async (path, method = "GET", body, extra = {}) => {
    let response;
    try {
      response = await fetch(path, { method, credentials: "same-origin", headers: {
        ...(body !== undefined && !(body instanceof Blob) ? { "Content-Type": "application/json" } : {}),
        ...(session?.csrfToken ? { "X-CSRF-Token": session.csrfToken } : {}), ...extra,
      }, body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body) });
    } catch { throw new Error("The connection failed. Your unsaved edits are still here."); }
    let result;
    try { result = await response.json(); } catch { throw new Error("The editor API is unavailable. Refresh and try again."); }
    if (!response.ok) {
      if (response.status === 401 && path.startsWith("/api/admin/")) setSession({ authenticated: false, initialized: true });
      throw new Error(result?.error?.message || "The request could not be completed.");
    }
    return result;
  }, [session?.csrfToken]);
  const loadDraft = useCallback(async () => {
    const data = await request("/api/admin/content");
    setContent(data.content || initialContent); setRevision(data.revision); setPublishedRevision(data.publishedRevision); setHistory(data.history || []); setDirty(false); setSelected(0);
  }, [request, initialContent]);
  useEffect(() => {
    const changed = () => { const value = consumeSetupFragment(); if (value) setSetupToken(value); };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin" }).then(async (response) => {
      if (!response.ok) throw new Error(); return response.json();
    }).then((value) => { if (active) setSession(value); }).catch(() => { if (active) { setError("The editor could not connect to its server. Try refreshing."); setSession({ authenticated: false, initialized: true }); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!session?.authenticated) return;
    let active = true;
    request("/api/admin/content").then((data) => {
      if (!active) return;
      setContent(data.content || initialContent); setRevision(data.revision); setPublishedRevision(data.publishedRevision); setHistory(data.history || []); setDirty(false);
    }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [session?.authenticated, request, initialContent]);
  useEffect(() => {
    const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const run = async (label, work) => { if (busy) return; setBusy(label); setError(""); setNotice(""); try { await work(); } catch (failure) { setError(failure.message); } finally { setBusy(""); } };
  const patchProfile = (key, value) => { setContent((current) => ({ ...current, profile: { ...current.profile, [key]: value } })); setDirty(true); };
  const rows = Array.isArray(content[section]) ? content[section] : [], item = rows[selected];
  const patchItem = (key, value) => { setContent((current) => ({ ...current, [section]: current[section].map((row, index) => index === selected ? { ...row, [key]: value } : row) })); setDirty(true); };
  const save = async () => {
    const data = await request("/api/admin/content", "PUT", { expectedRevision: revision, content });
    setRevision(data.revision); setContent(data.content); setDirty(false); setHistory((current) => [{ revision: data.revision, action: "save", created_at: data.createdAt }, ...current].slice(0, 30)); return data.revision;
  };
  const login = (event) => { event.preventDefault(); run("Signing in", async () => {
    const password = passwordRef.current?.value || "", email = emailRef.current?.value || "";
    if (passwordRef.current) passwordRef.current.value = "";
    const data = await request(`/api/auth/${setupToken ? "setup" : "login"}`, "POST", { email, password }, setupToken ? { "X-Setup-Token": setupToken } : {});
    setSetupToken(""); setSession(data); setNotice("Signed in.");
  }); };
  const upload = (file, asFrame = false) => run("Uploading original and preview", async () => {
    if (!file || !item) return;
    if (file.size > (file.type.startsWith("video/") ? 80 : 30) * 1024 * 1024) throw new Error("Choose an image under 30 MB or a video under 80 MB.");
    const preview = await previewBlob(file);
    const metadata = await request("/api/admin/media", "POST", { filename: file.name, mime: file.type, size: file.size, previewMime: preview.blob.type, previewSize: preview.blob.size });
    await request(`/api/admin/media/${metadata.id}/original`, "PUT", file, { "Content-Type": file.type });
    await request(`/api/admin/media/${metadata.id}/preview`, "PUT", preview.blob, { "Content-Type": preview.blob.type });
    const isVideo = file.type.startsWith("video/");
    const frame = { asset: metadata.original, full: metadata.original, video: isVideo ? metadata.original : null, thumbWebp: metadata.preview, poster: metadata.preview, width: preview.width, height: preview.height, nsfw: Boolean(item.nsfw), mediaType: isVideo ? "video" : "image" };
    setContent((current) => ({ ...current, [section]: current[section].map((row, index) => index === selected ? {
      ...(asFrame ? { ...row, frames: [...(row.frames || []), frame] } : { ...row, mediaId: metadata.id, mediaType: isVideo ? "video" : "image", full: metadata.original, frames: [frame, ...(row.frames || []).slice(1)],
      thumbWebp: metadata.preview, thumbAvif: null, heroWebp: section === "projects" ? metadata.original : metadata.preview, heroAvif: null,
      poster: metadata.preview, video: isVideo ? metadata.original : null, sourceMediaType: isVideo ? "video" : "image", videoStatus: isVideo ? "available" : null, width: preview.width, height: preview.height }),
    } : row) })); setDirty(true); setNotice("Original and preview uploaded. Save and publish to show this file on the site.");
    if (fileRef.current) fileRef.current.value = "";
  });
  const uploadAvatar = (file) => run("Uploading profile image", async () => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 30 * 1024 * 1024) throw new Error("Choose an image smaller than 30 MB for your profile.");
    const preview = await previewBlob(file);
    const metadata = await request("/api/admin/media", "POST", { filename: file.name, mime: file.type, size: file.size, previewMime: preview.blob.type, previewSize: preview.blob.size });
    await request(`/api/admin/media/${metadata.id}/original`, "PUT", file, { "Content-Type": file.type });
    await request(`/api/admin/media/${metadata.id}/preview`, "PUT", preview.blob, { "Content-Type": preview.blob.type });
    patchProfile("avatarUrl", metadata.preview); setNotice("Profile image uploaded. Save and publish to update your portfolio.");
  });

  if (session === null) return <main className="cms-page"><p role="status">Opening the editor…</p></main>;
  if (!session.authenticated) return <main className="cms-page cms-login"><a className="cms-back" href="/">← Portfolio</a><form onSubmit={login}>
    <p className="cms-eyebrow">Ashvini / owner editor</p><h1>{setupToken ? "Choose your password" : "Sign in"}</h1>
    <p>{setupToken ? "This private link sets the first password for your account. Choose at least 12 characters." : "Edit your work, then publish when it is ready."}</p>
    {error && <p role="alert" className="cms-error">{error}</p>}
    <label className="cms-field"><span>Email</span><input ref={emailRef} type="email" autoComplete="username" defaultValue={OWNER_EMAIL} required /></label>
    <label className="cms-field"><span>Password</span><input ref={passwordRef} type="password" autoComplete={setupToken ? "new-password" : "current-password"} minLength={setupToken ? 12 : undefined} maxLength={128} required /></label>
    <button disabled={Boolean(busy)} type="submit">{busy || (setupToken ? "Set password and sign in" : "Sign in")}</button>
    {!session.initialized && !setupToken && <p className="cms-muted">Use your private first-password link to activate this account.</p>}
    <p className="cms-muted">Password recovery is handled privately by the site administrator.</p>
  </form></main>;
  return <main className="cms-page">
    <header className="cms-header"><div><a className="cms-back" href="/">← Portfolio</a><p className="cms-eyebrow">Owner editor</p><h1>Your work, your words.</h1><p className="cms-muted">Draft {revision} · {publishedRevision === null ? "Not published yet" : `Live revision ${publishedRevision}`} {dirty ? "· Unsaved changes" : "· Saved"}</p></div>
      <div className="cms-actions"><button disabled={Boolean(busy) || !dirty} onClick={() => run("Saving draft", async () => { await save(); setNotice("Draft saved. The live site has not changed."); })}>Save draft</button>
        <button className="cms-primary" disabled={Boolean(busy)} onClick={() => run("Publishing", async () => { const next = dirty ? await save() : revision; const data = await request("/api/admin/publish", "POST", { expectedRevision: next }); setPublishedRevision(next); setHistory((current) => current.map((entry) => entry.revision === next ? { ...entry, published_at: data.publishedAt } : entry)); setNotice("Published. Your portfolio now uses this revision."); })}>Publish</button>
        <button onClick={() => run("Signing out", async () => { await request("/api/auth/logout", "POST", {}); setSession({ authenticated: false, initialized: true }); })} disabled={Boolean(busy)}>Sign out</button></div>
    </header>
    {error && <div className="cms-banner cms-error" role="alert">{error} <button onClick={() => run("Reloading draft", loadDraft)}>Reload saved draft</button></div>}
    {(notice || busy) && <p className="cms-banner" role="status">{busy || notice}</p>}
    <nav className="cms-tabs" aria-label="Editor sections">{COLLECTIONS.map((name) => <button key={name} aria-pressed={section === name} disabled={Boolean(busy)} onClick={() => { setSection(name); setSelected(0); }}>{name === "profile" ? "Profile & pages" : name}</button>)}</nav>
    <div className="cms-workspace" inert={Boolean(busy) || undefined}>
      {section === "profile" ? <section className="cms-panel"><h2>Profile & page text</h2><div className="cms-fields">{PROFILE_TEXT.map(([key, label]) => <FormField key={key} label={label} value={content.profile[key]} onChange={(value) => patchProfile(key, value)} multiline={/(Description|Bio|Intro|Note)$/.test(key)} />)}</div>
        <label className="cms-upload"><span>Upload profile image</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; uploadAvatar(file); }} /><small>The full original is retained alongside the profile preview.</small></label>
        <FormField label="Skills (one per line)" multiline value={(content.profile.skills || []).join("\n")} onChange={(value) => patchProfile("skills", value.split("\n").filter(Boolean))} />
        <FormField label="Home hero project ID (optional)" type="number" value={content.profile.homeHeroProjectId} onChange={(value) => patchProfile("homeHeroProjectId", value ? Number(value) : null)} />
        <ArrayEditor label="Experience" value={content.profile.experience} fields={[["years", "Years"], ["org", "Organization"], ["role", "Role"], ["note", "Description"], ["side", "Section"]]} onChange={(value) => patchProfile("experience", value)} />
        <ArrayEditor label="Questions & answers" value={content.profile.faq} fields={[["q", "Question"], ["a", "Answer"]]} onChange={(value) => patchProfile("faq", value)} />
        <fieldset className="cms-array"><legend>Publisher experience</legend>{(content.profile.publishers || []).map((publisher, index) => {
          const patch = (key, value) => patchProfile("publishers", content.profile.publishers.map((row, i) => i === index ? { ...row, [key]: value } : row));
          return <div className="cms-array-row" key={index}>{[["org", "Publisher"], ["role", "Role"], ["years", "Years"], ["about", "Publisher introduction"], ["work", "Your work"]].map(([key, label]) => <FormField key={key} label={label} value={publisher[key]} onChange={(value) => patch(key, value)} />)}<ArrayEditor label="Verified audience numbers" value={publisher.stats} fields={[["value", "Value"], ["label", "Label"], ["url", "Source URL"]]} onChange={(value) => patch("stats", value)} /><button className="cms-text-button" onClick={() => patchProfile("publishers", content.profile.publishers.filter((_, i) => i !== index))}>Remove publisher</button></div>;
        })}<button onClick={() => patchProfile("publishers", [...(content.profile.publishers || []), { org: "", role: "", years: "", about: "", work: "", stats: [] }])}>Add publisher</button></fieldset>
        <FormField label="Audience figures last checked" value={content.profile.audienceChecked} onChange={(value) => patchProfile("audienceChecked", value)} />
        <FormField label="Combined verified audience" value={content.profile.audienceLabel || content.profile.combinedFollowers} onChange={(value) => patchProfile("audienceLabel", value)} />
        <ArrayEditor label="Editorial categories" value={content.profile.editorialCategories} fields={[["id", "Category ID"], ["label", "Label"], ["blurb", "Introduction"]]} onChange={(value) => patchProfile("editorialCategories", value)} />
        <ArrayEditor label="Sketchbook chapters" value={content.profile.sketchChapters} fields={[["id", "Chapter ID"], ["label", "Label"], ["hand", "Short label"], ["blurb", "Introduction"]]} onChange={(value) => patchProfile("sketchChapters", value)} />
        <ArrayEditor label="Additional Contra work" value={content.profile.caseStudies} fields={[["title", "Title"], ["url", "URL"]]} onChange={(value) => patchProfile("caseStudies", value)} />
        <ArrayEditor label="Sketchbook timeline" value={content.profile.sketchTimeline} fields={[["year", "Year"], ["note", "Description"], ["slug", "Related sketch URL name"]]} onChange={(value) => patchProfile("sketchTimeline", value)} />
        <fieldset className="cms-array"><legend>Search previews</legend>{["home", "about", "editorial", "sketches"].map((page) => <div className="cms-array-row" key={page}><h3>{page}</h3>{["title", "description"].map((key) => <FormField key={key} label={key} value={content.profile.seo?.[page]?.[key]} onChange={(value) => patchProfile("seo", { ...content.profile.seo, [page]: { ...content.profile.seo?.[page], [key]: value } })} />)}</div>)}</fieldset>
      </section> : <><aside className="cms-list"><div className="cms-list-header"><h2>{section}</h2><button onClick={() => {
        const id = Math.max(0, ...content.projects.map((row) => Number(row.id) || 0)) + 1;
        const row = { ...(section === "projects" ? { id } : {}), slug: `new-work-${crypto.randomUUID().slice(0, 8)}`, title: "Untitled work", note: "", order: rows.length, highlight: false, nsfw: false, mediaType: "image", ...(section === "sketches" ? { chapter: "portraits" } : { category: "news" }) };
        setContent((current) => ({ ...current, [section]: [...current[section], row] })); setSelected(rows.length); setDirty(true);
      }}>Add work</button></div>{rows.map((row, index) => <button className="cms-list-item" key={row.slug || index} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>{row.title}</span><small>{row.nsfw ? "Sensitive content" : row.mediaType || "image"} · {row.slug}</small></button>)}</aside>
        <section className="cms-panel">{item ? <><div className="cms-item-head"><h2>{item.title}</h2><button className="cms-text-button" onClick={() => { setContent((current) => ({ ...current, [section]: current[section].filter((_, index) => index !== selected) })); setSelected(Math.max(0, selected - 1)); setDirty(true); }}>Remove from draft</button></div>
          {(item.poster || item.thumbWebp || item.heroWebp) && <img className="cms-preview" src={item.poster || item.thumbWebp || item.heroWebp} alt={item.title} />}
          <label className="cms-upload"><span>Upload original image or video</span><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime" onChange={(event) => upload(event.target.files?.[0])} /><small>Images up to 30 MB · videos up to 80 MB. The original stays at full quality; a separate preview is generated.</small></label>
          <div className="cms-fields">{ROW_TEXT.map(([key, label]) => {
            const field = key === "date" && section === "sketches" ? "dateISO" : key;
            const value = key === "date" && typeof item[field] === "string" ? item[field].slice(0, 10) : item[field];
            return <FormField key={key} label={label} value={value} onChange={(next) => patchItem(field, key === "date" && !next ? null : next)} multiline={["description", "note"].includes(key)} type={key === "date" ? "date" : "text"} />;
          })}
            <FormField label={section === "sketches" ? "Chapter" : "Category"} value={item[section === "sketches" ? "chapter" : "category"]} onChange={(value) => patchItem(section === "sketches" ? "chapter" : "category", value)} />
            <FormField label="Display order" type="number" value={item.order} onChange={(value) => patchItem("order", Number(value))} />
            {section === "sketches" && <FormField label="Year" type="number" value={item.year} onChange={(value) => patchItem("year", value ? Number(value) : null)} />}
          </div><div className="cms-checks"><label><input type="checkbox" checked={Boolean(item.highlight)} onChange={(event) => patchItem("highlight", event.target.checked)} /> Highlight this work</label><label><input type="checkbox" checked={Boolean(item.nsfw)} onChange={(event) => patchItem("nsfw", event.target.checked)} /> Sensitive / NSFW artwork (show a viewing gate)</label></div>
          {section === "projects" && <><FormField label="Roles (one per line)" multiline value={(item.roles || []).join("\n")} onChange={(value) => patchItem("roles", value.split("\n").filter(Boolean))} /><FormField label="Tools (one per line)" multiline value={(item.tools || []).join("\n")} onChange={(value) => patchItem("tools", value.split("\n").filter(Boolean))} /><FormField label="Spline scene URL" value={item.splineScene} onChange={(value) => patchItem("splineScene", value)} /><FormField label="External project URL" value={item.externalLink} onChange={(value) => patchItem("externalLink", value)} /><FormField label="Contra case-study URL" value={item.contraUrl} onChange={(value) => patchItem("contraUrl", value)} /></>}
          {section === "projects" && <ArrayEditor label="Additional project links" value={item.extraLinks} fields={[["label", "Label"], ["url", "URL"]]} onChange={(value) => patchItem("extraLinks", value)} />}
          {section === "projects" && <FormField label="Outcome" value={item.outcome} onChange={(value) => patchItem("outcome", value)} />}
          <ArrayEditor label="Source credits" value={item.sources} fields={[["label", "Credit"], ["url", "URL"]]} onChange={(value) => patchItem("sources", value)} />
          <ArrayEditor label="Additional gallery frames" value={item.frames} fields={[["asset", "Original media path"], ["thumbWebp", "Preview media path"], ["width", "Width", "number"], ["height", "Height", "number"], ["position", "Position", "number"], ["sourceUrl", "Source URL"], ["contentWarning", "Content warning (if needed)"]]} onChange={(value) => patchItem("frames", value)} />
          <label className="cms-upload"><span>Add an original image or video as another frame</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime" onChange={(event) => upload(event.target.files?.[0], true)} /><small>Additional frames keep their own originals and previews.</small></label>
        </> : <p>Select a work or add a new one.</p>}</section></>}
    </div>
    {history.length > 0 && <details className="cms-history"><summary>Saved revisions</summary><p>Restoring a revision updates the draft. Publish it to update the site.</p>{history.map((entry) => <div key={entry.revision}><span>Revision {entry.revision} · {entry.action} · {new Date(entry.created_at * 1000).toLocaleString()}{entry.published_at ? " · published" : ""}</span><button disabled={Boolean(busy)} onClick={() => run("Restoring revision", async () => { await request("/api/admin/rollback", "POST", { expectedRevision: revision, revision: entry.revision }); await loadDraft(); setNotice("Revision restored to the draft. Review it and publish when ready."); })}>Restore to draft</button></div>)}</details>}
  </main>;
}
