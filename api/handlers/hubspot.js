function splitName(fullName) {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { first: undefined, last: undefined };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: undefined };
  const last = parts.pop();
  return { first: parts.join(" "), last };
}

async function upsertHubSpotContact({ email, name, companyName, phoneNumber, token }) {
  if (!token) throw new Error("Missing HUBSPOT_ACCESS_TOKEN");
  const { first, last } = splitName(name);

  const url =
    "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert?idProperty=email";

  const body = {
    inputs: [
      {
        properties: {
          email,
          firstname: first,
          lastname: last,
          company: companyName || undefined,
          phone: phoneNumber || undefined,
          hs_legal_basis: "CONSENT_WITH_NOTICE",
          hs_legal_basis_explanation:
            "User consented via newsletter signup form on website.",
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, message: text };
  }
  return { ok: true };
}

module.exports = { upsertHubSpotContact };


