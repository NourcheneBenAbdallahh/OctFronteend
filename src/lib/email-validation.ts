/**
 * Validation email sans regex à backtracking (évite ReDoS — Sonar hotspot).
 */
export function isValidEmailFormat(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 254) {
    return false;
  }

  const at = trimmed.indexOf("@");
  if (at < 1) {
    return false;
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain || domain.includes("@")) {
    return false;
  }

  const dot = domain.lastIndexOf(".");
  if (dot < 1 || dot >= domain.length - 1) {
    return false;
  }

  if (local.includes(" ") || domain.includes(" ")) {
    return false;
  }

  return true;
}
