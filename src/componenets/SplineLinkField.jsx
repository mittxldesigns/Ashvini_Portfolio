import { useEffect, useId, useRef, useState } from "react";
import { parseSplineLink, verifySplineScene } from "../lib/splineLink.js";
import "./SplineLinkField.css";

export default function SplineLinkField({ value, onChange, disabled = false }) {
  const id = useId();
  const requestRef = useRef(null);
  const [check, setCheck] = useState({ url: "", state: "idle", message: "" });
  const parsed = parseSplineLink(value);
  const current = parsed.url && check.url === parsed.url;
  useEffect(() => () => requestRef.current?.abort(), []);

  const change = (event) => {
    requestRef.current?.abort();
    setCheck({ url: "", state: "idle", message: "" });
    const next = parseSplineLink(event.target.value);
    onChange(next.valid && next.url ? next.url : event.target.value);
  };
  const verify = async () => {
    if (!parsed.url || disabled) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setCheck({ url: parsed.url, state: "checking", message: "Checking scene file…" });
    const result = await verifySplineScene(parsed.url, { signal: controller.signal });
    if (!controller.signal.aborted) setCheck({ url: parsed.url, state: result.ok ? "ready" : "error", message: result.message || result.error });
  };

  return <section className="spline-link-field">
    <label className="cms-field" htmlFor={id}><span>Interactive 3D scene</span>
      <input id={id} type="url" value={value || ""} onChange={change} disabled={disabled} spellCheck={false} autoComplete="off"
        placeholder="Paste the copied .splinecode URL" aria-invalid={!parsed.valid || undefined} aria-describedby={`${id}-help ${id}-status`} />
    </label>
    <div id={`${id}-help`} className="spline-link-help">
      <p>In Spline, open your scene and choose <strong>Export → Code → Vanilla JS</strong>. Paste the copied code or its URL ending in <code>scene.splinecode</code>.</p>
      <p>Community links, editor links and iframe HTML belong outside this field.</p>
      <p>For later scene changes, promote the updated draft to Production in Spline.</p>
      <a href="https://docs.spline.design/exporting-your-scene/web/exporting-as-code" target="_blank" rel="noreferrer">Spline export guide ↗</a>
    </div>
    <div className="spline-link-actions"><button type="button" disabled={disabled || !parsed.url || current && check.state === "checking"} onClick={verify}>Check scene link</button>
      <p id={`${id}-status`} role="status" aria-live="polite" className={!parsed.valid || current && check.state === "error" ? "spline-link-error" : ""}>
        {!parsed.valid ? parsed.error : current ? check.message : parsed.url ? "Code-export URL format looks correct." : "Add your exported scene here when it’s ready."}
      </p>
    </div>
  </section>;
}
