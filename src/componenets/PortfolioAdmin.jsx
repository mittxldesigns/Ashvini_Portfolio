import { useCallback, useEffect, useRef, useState } from "react";
import "./PortfolioAdmin.css";
import AdminTags from "./AdminTags.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import MediaUpload from "./MediaUpload.jsx";
import SplineLinkField from "./SplineLinkField.jsx";
import { parseSplineLink } from "../lib/splineLink.js";
import { isFileTransfer, isTextEntry, transferFiles } from "../lib/mediaTransfer.js";
import { applyRefinements } from "../lib/adminRefinement.js";
import { previewBlob, validateUpload } from "../lib/mediaUpload.js";
import { galleryFrames, normalizeGalleryMedia } from "../lib/galleryMedia.js";

const OWNER_EMAIL = "kumarak9335@gmail.com";
const EMPTY = { schemaVersion: 1, revision: 0, profile: {}, projects: [], editorial: [], sketches: [] };
const COLLECTIONS = ["projects", "editorial", "sketches", "profile"];
const LABELS = { projects: "3D Work", editorial: "Social", sketches: "Sketchbook", profile: "Page text" };
const ACCEPT_MEDIA = "image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime,.m4v";
const PAGE_GROUPS = {
  about: ["name", "location", "rating", "aboutTitle", "aboutBio"],
  home: ["tagline", "homeDescription", "homeCred"],
  editorial: ["editorialTitle", "editorialIntro", "editorialYearsLabel", "editorialPubsTitle", "editorialPubsNote", "editorialClosingNote"],
  sketches: ["sketchesKicker", "sketchesIntro", "sketchesClosingNote"],
  links: ["contraUrl", "instagramUrl", "linkedinUrl", "splineUrl"],
};
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
function consumeSetupFragment() {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("setup") || "";
  if (!/^[a-f0-9]{64}$/.test(value)) return "";
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return value;
}

export default function PortfolioAdmin({ initialContent = EMPTY }) {
  const [session, setSession] = useState(null), [content, setContent] = useState(initialContent);
  const [revision, setRevision] = useState(0), [publishedRevision, setPublishedRevision] = useState(null);
  const [history, setHistory] = useState([]), [section, setSection] = useState("projects"), [selected, setSelected] = useState(0);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false), [search, setSearch] = useState(""), [filter, setFilter] = useState("all");
  const [mobileEditing, setMobileEditing] = useState(false), [profilePage, setProfilePage] = useState("about");
  const [refinements, setRefinements] = useState([]), [refineWarnings, setRefineWarnings] = useState([]);
  const publishRef = useRef(null), refineRef = useRef(null), editorRef = useRef(null), operationRef = useRef(false);
  const [setupToken, setSetupToken] = useState(consumeSetupFragment);
  const emailRef = useRef(null), passwordRef = useRef(null);
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
    setContent(data.content || initialContent); setRevision(data.revision); setPublishedRevision(data.publishedRevision); setHistory(data.history || []); setDirty(false); setLoaded(true); setSelected(0);
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
      setContent(data.content || initialContent); setRevision(data.revision); setPublishedRevision(data.publishedRevision); setHistory(data.history || []); setDirty(false); setLoaded(true);
    }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [session?.authenticated, request, initialContent]);
  useEffect(() => {
    const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const run = async (label, work) => { if (operationRef.current) return; operationRef.current = true; setBusy(label); setError(""); setNotice(""); try { await work(); } catch (failure) { setError(failure.message); } finally { operationRef.current = false; setBusy(""); } };
  const patchProfile = (key, value) => { setContent((current) => ({ ...current, profile: { ...current.profile, [key]: value } })); setDirty(true); };
  const rows = Array.isArray(content[section]) ? content[section] : [], item = rows[selected];
  const patchItem = (key, value) => { setContent((current) => ({ ...current, [section]: current[section].map((row, index) => index === selected ? { ...row, [key]: value } : row) })); setDirty(true); };
  const save = async () => {
    const projects = content.projects.map((project) => {
      const scene = parseSplineLink(project.splineScene);
      if (!scene.valid) throw new Error(`${project.title}: ${scene.error}`);
      return { ...project, splineScene: scene.url || null };
    });
    const data = await request("/api/admin/content", "PUT", { expectedRevision: revision, content: { ...content, projects } });
    setRevision(data.revision); setContent(data.content); setDirty(false); setHistory((current) => [{ revision: data.revision, action: "save", created_at: data.createdAt }, ...current].slice(0, 30)); return data.revision;
  };
  const login = (event) => { event.preventDefault(); run("Signing in", async () => {
    const password = passwordRef.current?.value || "", email = emailRef.current?.value || "";
    if (passwordRef.current) passwordRef.current.value = "";
    const data = await request(`/api/auth/${setupToken ? "setup" : "login"}`, "POST", { email, password }, setupToken ? { "X-Setup-Token": setupToken } : {});
    setLoaded(false); setSetupToken(""); setSession(data); setNotice("Signed in.");
  }); };
  const putFile = (path, file, mime, label) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open("PUT", path); xhr.withCredentials = true; xhr.timeout = 600000;
    xhr.setRequestHeader("Content-Type", mime); xhr.setRequestHeader("X-CSRF-Token", session.csrfToken);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setBusy(`${label} ${Math.round(event.loaded / event.total * 100)}%`); };
    xhr.onerror = () => reject(new Error("Upload interrupted. Your existing work is safe; choose the file again to retry."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Check your connection and try again."));
    xhr.onload = () => { let result; try { result = JSON.parse(xhr.responseText); } catch { reject(new Error("The upload service returned an unexpected response.")); return; }
      if (xhr.status === 401) setSession({ authenticated: false, initialized: true });
      xhr.status >= 200 && xhr.status < 300 ? resolve(result) : reject(new Error(result?.error?.message || "The upload could not finish."));
    };
    xhr.send(file);
  });
  const uploadFiles = (files, asFrame = true) => run("Preparing upload…", async () => {
    if (!files.length || !item) return;
    if (files.length > 10) throw new Error("Add up to 10 files at a time.");
    if (!asFrame && files.length > 1) throw new Error("Choose one cover, or use Add to gallery for several files.");
    const prepared = files.map((file) => ({ file, mime: validateUpload(file) }));
    let completed = 0;
    for (const { file, mime } of prepared) {
      const position = files.length > 1 ? `${completed + 1}/${files.length} · ` : "";
      try {
        setBusy(`${position}Preparing ${file.name || "image"}…`);
        const preview = await previewBlob(file, mime);
        const metadata = await request("/api/admin/media", "POST", { filename: file.name || "pasted-image.png", mime, size: file.size, previewMime: preview.blob.type, previewSize: preview.blob.size });
        await putFile(`/api/admin/media/${metadata.id}/original`, file, mime, `${position}Uploading original`);
        await putFile(`/api/admin/media/${metadata.id}/preview`, preview.blob, preview.blob.type, `${position}Uploading preview`);
        const isVideo = mime.startsWith("video/");
        const frame = { asset: metadata.original, full: metadata.original, video: isVideo ? metadata.original : null, thumbWebp: metadata.preview, poster: metadata.preview, width: preview.width, height: preview.height, nsfw: Boolean(item.nsfw), mediaType: isVideo ? "video" : "image" };
        setContent((current) => ({ ...current, [section]: current[section].map((row, index) => {
          if (index !== selected) return row;
          const existing = galleryFrames(row);
          const frames = (asFrame ? [...existing, frame] : [frame, ...existing.slice(1)]).map((entry, i) => ({ ...entry, position: i + 1 }));
          return normalizeGalleryMedia({ ...row, mediaId: metadata.id, frames }, section === "projects");
        }) }));
        completed++; setDirty(true);
      } catch (failure) {
        throw new Error(`${completed ? `${completed} of ${files.length} files added to your draft. ` : ""}${file.name || "This file"}: ${failure.message} Remaining files were not uploaded.`);
      }
    }
    setNotice(`${completed === 1 ? "File added" : `${completed} files added`} to your draft. Save and publish when ready.`);
  });
  const pasteMedia = (event) => {
    if (isTextEntry(event.target) || event.target.closest?.("dialog")) return;
    const files = transferFiles(event.clipboardData);
    if (!files.length) return;
    event.preventDefault();
    if (busy || !loaded) return;
    if (!item || section === "profile" || (!mobileEditing && window.matchMedia("(max-width: 760px)").matches)) { setError("Open a piece first, then paste an image to add it to the gallery."); return; }
    uploadFiles(files);
  };
  const uploadPoster = (file) => run("Preparing thumbnail…", async () => {
    if (!file || !item) return;
    const mime = validateUpload(file);
    if (!mime.startsWith("image/")) throw new Error("Choose an image for the video thumbnail.");
    const preview = await previewBlob(file, mime);
    const metadata = await request("/api/admin/media", "POST", { filename: file.name, mime, size: file.size, previewMime: preview.blob.type, previewSize: preview.blob.size });
    await putFile(`/api/admin/media/${metadata.id}/original`, file, mime, "Uploading thumbnail original");
    await putFile(`/api/admin/media/${metadata.id}/preview`, preview.blob, preview.blob.type, "Uploading thumbnail");
    const frames = galleryFrames(item).map((frame, index) => index === 0 ? { ...frame, thumbWebp: metadata.preview, thumbAvif: null, poster: metadata.preview } : frame);
    updateFrames(frames); setNotice("Thumbnail changed. Your video is unchanged. Save and publish when ready.");
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

  const changeSection = (next) => { setSection(next); setSelected(0); setSearch(""); setFilter("all"); setMobileEditing(false); };
  const chooseWork = (index) => { setSelected(index); setMobileEditing(true); requestAnimationFrame(() => { editorRef.current?.focus({ preventScroll: true }); if (window.matchMedia("(max-width: 760px)").matches) editorRef.current?.closest(".cms-page")?.scrollTo({ top: 0 }); }); };
  const addWork = () => {
    const id = Math.max(0, ...content.projects.map((row) => Number(row.id) || 0)) + 1;
    const group = section === "sketches" ? "chapter" : "category";
    const choices = section === "sketches" ? content.profile.sketchChapters : content.profile.editorialCategories;
    const row = { ...(section === "projects" ? { id, roles: [], tools: [], extraLinks: [] } : { [group]: choices?.[0]?.id || "" }), slug: `new-work-${crypto.randomUUID().slice(0, 8)}`, title: "Untitled work", note: "", order: rows.length, highlight: false, nsfw: false, mediaType: "image" };
    setContent((current) => ({ ...current, [section]: [...current[section], row] })); setSelected(rows.length); setDirty(true); setSearch(""); setFilter("all"); setMobileEditing(true);
  };
  const updateFrames = (frames) => { setContent((current) => ({ ...current, [section]: current[section].map((row, index) => index === selected ? normalizeGalleryMedia({ ...row, frames: frames.map((frame, i) => ({ ...frame, position: i + 1 })) }, section === "projects") : row) })); setDirty(true); };
  const moveFrame = (from, to) => { const frames = [...galleryFrames(item)]; const [frame] = frames.splice(from, 1); frames.splice(to, 0, frame); updateFrames(frames); };
  const moveWork = (delta) => {
    const destination = selected + delta;
    if (destination < 0 || destination >= rows.length) return;
    setContent((current) => { const next = [...current[section]]; const [row] = next.splice(selected, 1); next.splice(destination, 0, row); return { ...current, [section]: next.map((entry, index) => ({ ...entry, order: index })) }; });
    setSelected(destination); setDirty(true);
  };
  const refine = () => run("Reviewing your draft with AI…", async () => {
    const suggestions = [], warnings = [], seen = new Set();
    let cursor = 0;
    do {
      if (seen.has(cursor)) throw new Error("The review stopped unexpectedly. Your draft has not changed. Try again.");
      seen.add(cursor);
      const result = await request("/api/admin/refine", "POST", { content, cursor });
      suggestions.push(...(result.suggestions || [])); warnings.push(...(result.warnings || []));
      setBusy(`Reviewing your draft… ${result.reviewedFields || 0} of ${result.totalFields || 0} fields`);
      cursor = result.nextCursor ?? null;
    } while (cursor !== null);
    setRefinements(suggestions.map((suggestion) => ({ ...suggestion, selected: true })));
    setRefineWarnings([...new Set(warnings)]); refineRef.current?.showModal();
  });
  const applySuggestions = () => {
    const result = applyRefinements(content, refinements.filter((suggestion) => suggestion.selected));
    if (result.applied) { setContent(result.content); setDirty(true); }
    setNotice(`${result.applied} suggestions applied to the draft.${result.skipped ? ` ${result.skipped} outdated suggestions were skipped.` : ""} Review and publish when ready.`);
    refineRef.current?.close();
  };
  const publish = () => run("Publishing…", async () => {
    const next = dirty ? await save() : revision;
    const data = await request("/api/admin/publish", "POST", { expectedRevision: next });
    setPublishedRevision(next); setHistory((current) => current.map((entry) => entry.revision === next ? { ...entry, published_at: data.publishedAt } : entry));
    setNotice("Published. Your website is up to date."); publishRef.current?.close();
  });
  const visibleRows = rows.map((row, index) => ({ row, index })).filter(({ row }) =>
    `${row.title} ${row.client || ""} ${row.medium || ""}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || filter === "video" && galleryFrames(row).some((frame) => frame.mediaType === "video") || filter === "highlight" && row.highlight || filter === "sensitive" && row.nsfw));
  const categories = section === "sketches" ? content.profile.sketchChapters || [] : section === "editorial" ? content.profile.editorialCategories || [] :
    [...new Set(["Product renders", "Animation", "Interactive 3D", "Studies", ...content.projects.map((project) => project.category).filter(Boolean)])].map((category) => ({ id: category, label: category }));
  const frames = item ? galleryFrames(item) : [];
  const selectedFrame = frames[0];

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
  return <main className={`cms-page${section === "sketches" ? " cms-paper" : ""}`} onPaste={pasteMedia}
    onDragOver={(event) => { if (isFileTransfer(event.dataTransfer)) { event.preventDefault(); event.dataTransfer.dropEffect = "none"; } }}
    onDrop={(event) => { if (isFileTransfer(event.dataTransfer)) { event.preventDefault(); if (!busy) setError("Drop files into a media upload area so they go to the right place."); } }}>
    <header className="cms-header">
      <div className="cms-header-main"><a className="cms-brand" href="/" target="_blank" rel="noreferrer">Ashvini</a><div><h1 className="cms-heading">Your studio</h1><p className="cms-status" role="status">{!loaded ? "Loading your saved work…" : dirty ? "Unsaved changes" : revision !== publishedRevision ? "Draft saved · ready to publish" : "Everything is live"}</p></div></div>
      <div className="cms-actions">
        <a className="cms-view-site" href="/" target="_blank" rel="noreferrer">View website ↗</a>
        <button disabled={!!busy || !loaded} onClick={refine}>Refine with AI</button>
        <button disabled={!!busy || !dirty || !loaded} onClick={() => run("Saving draft…", async () => { await save(); setNotice("Draft saved. Publish when you’re ready."); })}>Save draft</button>
        <button className="cms-primary" disabled={!!busy || !loaded || (!dirty && revision === publishedRevision)} onClick={() => publishRef.current?.showModal()}>Publish</button>
      </div>
    </header>
    {error && <div className="cms-banner cms-error" role="alert">{error}<button onClick={() => { if (!dirty || window.confirm("Reload the saved draft and discard unsaved changes?")) run("Reloading draft…", loadDraft); }}>Reload saved draft</button></div>}
    {(notice || busy) && <p className="cms-banner" role="status">{busy || notice}</p>}
    <nav className="cms-tabs" aria-label="Editor sections">{COLLECTIONS.map((name) => <button key={name} aria-label={name === "profile" ? LABELS[name] : `${LABELS[name]}, ${content[name]?.length || 0} ${name === "projects" ? "projects" : "items"}`} aria-pressed={section === name} disabled={!!busy} onClick={() => changeSection(name)}>{LABELS[name]}{name !== "profile" && <span>{content[name]?.length || 0}</span>}</button>)}</nav>
    <div className="cms-workspace" data-editing={mobileEditing || section === "profile"} inert={!!busy || !loaded || undefined}>
      {section === "profile" ? <section className="cms-panel cms-profile-group">
        <h2>Page text & profile</h2><p className="cms-muted">Choose a page, change the words, then save your draft.</p>
        <nav className="cms-page-tabs" aria-label="Pages">{Object.keys(PAGE_GROUPS).map((page) => <button aria-pressed={profilePage === page} key={page} onClick={() => setProfilePage(page)}>{page === "editorial" ? "Social" : page === "sketches" ? "Sketchbook" : page[0].toUpperCase() + page.slice(1)}</button>)}</nav>
        <div className="cms-fields">{PROFILE_TEXT.filter(([key]) => PAGE_GROUPS[profilePage].includes(key)).map(([key, label]) => <FormField key={key} label={label} value={content.profile[key]} onChange={(value) => patchProfile(key, value)} multiline={/(Description|Bio|Intro|Note)$/.test(key)} />)}</div>
        {profilePage === "about" && <><MediaUpload label="Profile photo" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" disabled={!!busy} onFiles={(files) => uploadAvatar(files[0])} hint="Choose, drop or paste one image." /><AdminTags label="Skills" value={content.profile.skills || []} onChange={(value) => patchProfile("skills", value)} placeholder="Spline, Blender, Photoshop" /></>}
        {profilePage === "home" && <label className="cms-field"><span>Featured work on Home</span><select value={content.profile.homeHeroProjectId || ""} onChange={(event) => patchProfile("homeHeroProjectId", event.target.value ? Number(event.target.value) : null)}><option value="">Rotate through my work</option>{content.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
        <details className="cms-advanced"><summary>Experience, credits & gallery settings</summary>
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
        </details>
      </section> : <>
        <aside className="cms-list">
          <div className="cms-section-top"><div><h2>{LABELS[section]}</h2><p className="cms-muted">{rows.length} pieces · select one to edit</p></div><button className="cms-primary" onClick={addWork}>+ Add work</button></div>
          <label className="cms-search"><span className="sr-only">Search your work</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a piece…" /></label>
          <div className="cms-filters" aria-label="Filter work">{[["all", "All"], ["video", "Videos"], ["highlight", "Highlights"], ["sensitive", "Sensitive"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
          {visibleRows.map(({ row, index }) => <button className="cms-list-item" key={row.slug || index} aria-pressed={selected === index} onClick={() => chooseWork(index)}>
            <span className={`cms-list-thumb${row.nsfw ? " cms-sensitive" : ""}`}>{(row.thumbWebp || row.poster) ? <img src={row.thumbWebp || row.poster} alt="" loading="lazy" /> : <span>+</span>}</span>
            <span><strong className="cms-item-title">{row.title}</strong><small className="cms-item-meta">{galleryFrames(row).some((frame) => frame.mediaType === "video") ? "Video" : "Image"}{row.highlight ? " · Highlight" : ""}{row.nsfw ? " · Sensitive" : ""}{!row.thumbWebp ? " · Needs media" : ""}</small></span>
          </button>)}
          {!visibleRows.length && <div className="cms-empty"><p>{rows.length ? "No work matches this search." : "Add your first piece here."}</p><button onClick={rows.length ? () => { setSearch(""); setFilter("all"); } : addWork}>{rows.length ? "Clear filters" : "Add work"}</button></div>}
        </aside>
        <section className="cms-panel" ref={editorRef} tabIndex={-1}>{item ? <>
          <button className="cms-back-to-list" onClick={() => setMobileEditing(false)}>← All {LABELS[section]}</button>
          <div className="cms-item-head"><h2>{item.title}</h2><div className="cms-media-actions"><button disabled={selected === 0} onClick={() => moveWork(-1)} aria-label="Move work earlier">↑</button><button disabled={selected === rows.length - 1} onClick={() => moveWork(1)} aria-label="Move work later">↓</button></div></div>
          <MediaUpload label={selectedFrame ? "Replace cover image / video" : "Add a cover image or video"} accept={ACCEPT_MEDIA} disabled={!!busy} onFiles={(files) => uploadFiles(files, false)} hint="One cover file. Images up to 30 MB; videos up to 80 MB. MP4 with H.264 works best. Originals are kept unchanged.">
          <div className="cms-media-stage">
            {selectedFrame ? selectedFrame.mediaType === "video" ? <VideoPlayer src={selectedFrame.video || selectedFrame.full || selectedFrame.asset} poster={selectedFrame.poster || selectedFrame.thumbWebp} title={`Preview ${item.title}`} width={selectedFrame.width} height={selectedFrame.height} /> : <img className="cms-preview" src={selectedFrame.thumbWebp || item.thumbWebp} alt={item.title} /> : <div className="cms-empty"><strong>Start with your work.</strong><p>Add an image or a video render. You can arrange more frames below.</p></div>}
          </div>
          </MediaUpload>
          {selectedFrame?.mediaType === "video" && <MediaUpload label="Video thumbnail" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!!busy} onFiles={(files) => uploadPoster(files[0])} hint="An image shown before playback. Changing this leaves the video intact; transparent images keep their transparency." />}
          {frames.length > 0 && <div className="cms-frame-strip" aria-label="Gallery frames">{frames.map((frame, index) => <div className="cms-frame" key={`${frame.full || frame.asset}-${index}`}>
            <img src={frame.thumbWebp || frame.poster} alt={`Frame ${index + 1}`} loading="lazy" />
            <span className="cms-frame-cover">{index === 0 ? "Cover" : `Frame ${index + 1}`}{frame.mediaType === "video" ? " · Video" : ""}</span>
            <div className="cms-frame-actions"><button disabled={index === 0} onClick={() => moveFrame(index, index - 1)} aria-label={`Move frame ${index + 1} earlier`}>←</button><button disabled={index === frames.length - 1} onClick={() => moveFrame(index, index + 1)} aria-label={`Move frame ${index + 1} later`}>→</button>{index > 0 && <button onClick={() => moveFrame(index, 0)}>Make cover</button>}{frames.length > 1 && <button onClick={() => updateFrames(frames.filter((_, i) => i !== index))} aria-label={`Remove frame ${index + 1}`}>×</button>}</div>
          </div>)}</div>}
          <MediaUpload label="Add to gallery" accept={ACCEPT_MEDIA} multiple disabled={!!busy} onFiles={uploadFiles} hint="Add up to 10 images or videos together, in the order selected. You can also paste an image while viewing this piece. Text fields keep normal paste." />
          <div className="cms-fields">
            <FormField label="Title" value={item.title} onChange={(value) => patchItem("title", value)} />
            <label className="cms-field"><span>{section === "sketches" ? "Sketchbook section" : "Category"}</span><select value={item[section === "sketches" ? "chapter" : "category"] || ""} onChange={(event) => patchItem(section === "sketches" ? "chapter" : "category", event.target.value)}><option value="" disabled>Choose where this belongs</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <FormField label="Caption" multiline value={item.note} onChange={(value) => patchItem("note", value)} />
            <FormField label="Description" multiline value={item.description} onChange={(value) => patchItem("description", value)} />
            {section !== "sketches" && <FormField label="Client / publisher" value={item.client} onChange={(value) => patchItem("client", value)} />}
            {section === "sketches" && <><FormField label="Medium" value={item.medium} onChange={(value) => patchItem("medium", value)} /><FormField label="Artwork year" type="number" value={item.year} onChange={(value) => patchItem("year", value ? Number(value) : null)} /></>}
            <FormField label="Original post link (optional)" value={item.url} onChange={(value) => patchItem("url", value)} />
          </div>
          {section === "projects" && <SplineLinkField value={item.splineScene} onChange={(value) => patchItem("splineScene", value)} disabled={!!busy} />}
          <div className="cms-checks"><label><input type="checkbox" checked={!!item.highlight} onChange={(event) => patchItem("highlight", event.target.checked)} /> Show in Highlights</label><label><input type="checkbox" checked={!!item.nsfw} onChange={(event) => patchItem("nsfw", event.target.checked)} /> Blur and warn before viewing</label></div>
          {item.nsfw && <FormField label="Viewing warning" value={item.contentWarning} onChange={(value) => patchItem("contentWarning", value)} />}
          {section === "projects" && <><AdminTags label="Tools" value={item.tools || []} onChange={(value) => patchItem("tools", value)} placeholder="Blender, Spline, After Effects" /><AdminTags label="Your roles" value={item.roles || []} onChange={(value) => patchItem("roles", value)} placeholder="3D modelling, Animation" /></>}
          <details className="cms-advanced"><summary>More details & links</summary>
            {ROW_TEXT.filter(([key]) => ["slug", "date", "dateLabel", "platform"].includes(key)).map(([key, label]) => { const field = key === "date" && section === "sketches" ? "dateISO" : key; return <FormField key={key} label={label} type={key === "date" ? "date" : "text"} value={key === "date" ? item[field]?.slice(0, 10) : item[field]} onChange={(value) => patchItem(field, key === "date" && !value ? null : value)} />; })}
            {section === "projects" && <><FormField label="External project URL" value={item.externalLink} onChange={(value) => patchItem("externalLink", value)} /><FormField label="Contra case-study URL" value={item.contraUrl} onChange={(value) => patchItem("contraUrl", value)} /><FormField label="Outcome" value={item.outcome} onChange={(value) => patchItem("outcome", value)} /><ArrayEditor label="Additional links" value={item.extraLinks} fields={[["label", "Label"], ["url", "URL"]]} onChange={(value) => patchItem("extraLinks", value)} /></>}
            <ArrayEditor label="Source credits" value={item.sources} fields={[["label", "Credit"], ["url", "URL"]]} onChange={(value) => patchItem("sources", value)} />
            <details><summary>Original media paths</summary><ArrayEditor label="Frames" value={item.frames} fields={[["asset", "Original media path"], ["thumbWebp", "Preview path"], ["mediaType", "Media type: image or video"], ["sourceUrl", "Source link"]]} onChange={(value) => updateFrames(value)} /></details>
            <button className="cms-text-button" onClick={() => { if (!window.confirm(`Remove “${item.title}” from the draft? The live site stays as it is until you publish.`)) return; setContent((current) => ({ ...current, [section]: current[section].filter((_, index) => index !== selected) })); setSelected(Math.max(0, selected - 1)); setDirty(true); setMobileEditing(false); }}>Remove this work from draft</button>
          </details>
        </> : <div className="cms-empty"><h2>Choose a piece to edit</h2><button className="cms-primary" onClick={addWork}>Add work</button></div>}</section>
      </>}
    </div>
    <footer className="cms-footer"><p>Changes stay in your draft until you publish.</p><button disabled={!!busy} onClick={() => { if (dirty && !window.confirm("Sign out without saving these changes?")) return; run("Signing out…", async () => { await request("/api/auth/logout", "POST", {}); setSession({ authenticated: false, initialized: true }); setLoaded(false); }); }}>Sign out</button></footer>
    {history.length > 0 && <details className="cms-history"><summary>Version history</summary><p>Restore a saved version to your draft, then publish when ready.</p>{history.map((entry) => <div key={entry.revision}><span>Version {entry.revision} · {new Date(entry.created_at * 1000).toLocaleString()}{entry.published_at ? " · Published" : ""}</span><button disabled={!!busy} onClick={() => { if (dirty && !window.confirm("Restore this version and replace your unsaved draft?")) return; run("Restoring version…", async () => { await request("/api/admin/rollback", "POST", { expectedRevision: revision, revision: entry.revision }); await loadDraft(); setNotice("Version restored to draft. Review it before publishing."); }); }}>Restore</button></div>)}</details>}
    <dialog ref={publishRef} className="cms-publish-dialog"><h2>Publish your changes?</h2>{error && <p role="alert" className="cms-error">{error}</p>}<p>Your current draft will replace the live portfolio. You can restore a saved version later.</p><p>{content.projects.length} 3D pieces, {content.editorial.length} social posts, {content.sketches.length} artworks.</p><div className="cms-dialog-actions"><button disabled={!!busy} onClick={() => publishRef.current?.close()}>Keep editing</button><button className="cms-primary" disabled={!!busy} onClick={publish}>{busy || "Publish website"}</button></div></dialog>
    <dialog ref={refineRef} className="cms-refine-dialog"><h2>Refine your draft</h2><p>Review each suggestion. Nothing changes on the live site until you publish.</p>{refineWarnings.map((warning, index) => <p key={index} className="cms-muted">{warning}</p>)}
      {!refinements.length && <p>No wording changes were suggested.</p>}
      {refinements.map((suggestion, index) => <label className="cms-suggestion" key={index}><input className="cms-suggestion-check" type="checkbox" checked={suggestion.selected} onChange={(event) => setRefinements((current) => current.map((entry, i) => i === index ? { ...entry, selected: event.target.checked } : entry))} /><span><strong>{suggestion.label || suggestion.path.join(" / ")}</strong><span className="cms-suggestion-before">{suggestion.before || "Empty"}</span><span className="cms-suggestion-after">{suggestion.after}</span><small>{suggestion.reason}</small></span></label>)}
      <div className="cms-dialog-actions"><button onClick={() => refineRef.current?.close()}>Keep my wording</button><button className="cms-primary" disabled={!refinements.some((suggestion) => suggestion.selected)} onClick={applySuggestions}>Apply selected to draft</button></div>
    </dialog>
  </main>;
}
