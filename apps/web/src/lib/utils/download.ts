/**
 * Trigger a browser download of a Blob using an object URL.
 *
 * We use this helper instead of a plain `<a href>` so requests can pass the
 * in-memory JWT bearer token and `credentials: 'include'` via fetch. A plain
 * anchor would be unauthenticated and rejected by RBAC.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revocation to let the browser dispatch the click cleanly.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function csvFilename(module: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `finance-${module}-${stamp}.csv`;
}
