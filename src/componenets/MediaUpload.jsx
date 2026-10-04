import { useRef, useState } from 'react';
import { isFileTransfer, isTextEntry, transferFiles } from '../lib/mediaTransfer.js';

export default function MediaUpload({ label, hint, accept, multiple = false, disabled = false, onFiles, children }) {
  const input = useRef(null), depth = useRef(0);
  const [dragging, setDragging] = useState(false), [error, setError] = useState('');
  const receive = (files) => {
    if (disabled || !files.length) return;
    if (!multiple && files.length > 1) { setError('Choose one file here. Use “Add to gallery” for several files.'); return; }
    setError(''); onFiles(files);
  };
  const resetDrag = () => { depth.current = 0; setDragging(false); };
  return <div className={`cms-upload cms-dropzone${dragging && !disabled ? ' is-drag-over' : ''}`} role="group" aria-label={label} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0}
    onKeyDown={(event) => { if (!disabled && event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); input.current?.click(); } }}
    onDragEnter={(event) => { if (!isFileTransfer(event.dataTransfer)) return; event.preventDefault(); event.stopPropagation(); depth.current++; if (!disabled) setDragging(true); }}
    onDragOver={(event) => { if (!isFileTransfer(event.dataTransfer)) return; event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}
    onDragLeave={(event) => { event.stopPropagation(); depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); }}
    onDrop={(event) => { if (!isFileTransfer(event.dataTransfer) && !transferFiles(event.dataTransfer).length) return; event.preventDefault(); event.stopPropagation(); resetDrag(); receive(transferFiles(event.dataTransfer)); }}
    onPaste={(event) => { if (isTextEntry(event.target)) return; const files = transferFiles(event.clipboardData); if (!files.length) return; event.preventDefault(); event.stopPropagation(); receive(files); }}>
    <span className="cms-drop-title">{label}</span>
    {children}
    <div className="cms-drop-actions"><button type="button" disabled={disabled} onClick={() => input.current?.click()}>{multiple ? 'Choose files' : 'Choose file'}</button><small>or drop {multiple ? 'files' : 'a file'} here · paste an image</small></div>
    <input ref={input} type="file" hidden aria-label={label} accept={accept} multiple={multiple} disabled={disabled} onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ''; receive(files); }} />
    {hint && <small>{hint}</small>}
    {error && <p className="cms-error" role="alert">{error}</p>}
  </div>;
}
