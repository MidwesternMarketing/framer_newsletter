function splitName(fullName) {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { first: undefined, last: undefined };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: undefined };
  const last = parts.pop();
  return { first: parts.join(" "), last };
}

async function subscribeToBeehiiv({ email, name, publicationId, apiKey, origin }) {
  if (!apiKey) throw new Error("Missing BEEHIIV_API_KEY");
  if (!publicationId) throw new Error("Missing BEEHIIV_PUBLICATION_ID");
  const { first, last } = splitName(name);

  const url = `https://api.beehiiv.com/v2/publications/${encodeURIComponent(publicationId)}/subscriptions`;
  const body = {
    email,
    reactivate_existing: true,
    send_welcome_email: false,
    utm_source: "framer",
    referring_site: origin || undefined,
    first_name: first,
    last_name: last,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, message: text };
  }
  return { ok: true };
}

module.exports = { subscribeToBeehiiv };


