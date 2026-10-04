// Browsers expose the same file in both lists; prefer files to avoid duplicates.
export function transferFiles(transfer) {
  const files = Array.from(transfer?.files || []);
  return files.length ? files : Array.from(transfer?.items || []).filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter(Boolean);
}
export function isFileTransfer(transfer) {
  return !!transfer?.files?.length || Array.from(transfer?.types || []).includes('Files') || Array.from(transfer?.items || []).some((item) => item.kind === 'file');
}
export function isTextEntry(target) {
  return !!target?.closest?.('textarea, input:not([type="file"]):not([type="button"]):not([type="checkbox"]), [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
}
