export function triggerDownload(data: Uint8Array | Blob, filename: string, mime?: string): void {
  const blob = data instanceof Blob ? data : new Blob([new Uint8Array(data)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
