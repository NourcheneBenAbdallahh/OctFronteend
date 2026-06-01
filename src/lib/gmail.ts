/** URL Gmail « Nouveau message » avec destinataire (et optionnellement objet / corps). */
export function buildGmailComposeUrl(
  email: string,
  options?: { subject?: string; body?: string }
): string {
  const to = email.trim();
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
  });
  const subject = options?.subject?.trim();
  const body = options?.body?.trim();
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
