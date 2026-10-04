import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { parseTags } from "../lib/adminTags.js";

export default function AdminTags({ label, value, onChange, placeholder = "Add a tag", disabled = false }) {
  const id = useId(), [draft, setDraft] = useState("");
  const pending = useRef("");
  const tags = parseTags(value);
  const setPending = (text) => { pending.current = text; setDraft(text); };
  const commit = (text = pending.current, synchronous = false) => {
    if (disabled) return;
    const next = parseTags(text, tags), previous = Array.isArray(value) ? value : [];
    const changed = next.length !== previous.length || next.some((tag, index) => tag !== previous[index]);
    pending.current = "";
    const update = () => { setDraft(""); if (changed) onChange(next); };
    if (synchronous) flushSync(update); else update();
  };
  const keyDown = (event) => {
    if (disabled || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); commit(); }
    else if (event.key === "Backspace" && !pending.current && tags.length) {
      event.preventDefault(); onChange(tags.slice(0, -1));
    }
  };
  const paste = (event) => {
    if (disabled) return;
    const text = event.clipboardData.getData("text");
    if (!text.includes(",")) return;
    event.preventDefault();
    const input = event.currentTarget, start = input.selectionStart ?? draft.length, end = input.selectionEnd ?? start;
    commit(pending.current.slice(0, start) + text + pending.current.slice(end));
  };
  return <div className="cms-field">
    <label htmlFor={id}>{label}</label>
    <div className="cms-tag-input" role="group" aria-label={label}>
      {tags.map((tag) => <span className="cms-tag" key={tag.toLowerCase()}>{tag}
        <button type="button" className="cms-tag-remove" aria-label={`Remove ${tag}`} disabled={disabled} onClick={() => onChange(tags.filter((entry) => entry !== tag))}>×</button>
      </span>)}
      <input id={id} className="cms-tag-entry" aria-label={label} value={draft} placeholder={placeholder} disabled={disabled}
        onChange={(event) => { const text = event.target.value; if (text.includes(",") && !event.nativeEvent.isComposing) commit(text); else setPending(text); }}
        onKeyDown={keyDown} onPaste={paste} onBlur={() => commit(pending.current, true)} />
    </div>
  </div>;
}
