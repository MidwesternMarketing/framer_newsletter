// Vercel-style serverless function handler
const { subscribeToBeehiiv } = require("./handlers/beehiiv");
const { upsertHubSpotContact } = require("./handlers/hubspot");

// Naive in-memory rate limiter (best-effort only on serverless)
const submissionsByIp = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3;

function getIp(req) {
  const fwd = req.headers["x-forwarded-for"]; // may be a list
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimit(req) {
  const ip = getIp(req);
  const now = Date.now();
  const entry = submissionsByIp.get(ip) || [];
  const recent = entry.filter((ts) => now - ts < WINDOW_MS);
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return recent.length <= MAX_REQUESTS;
}

function sendCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  sendCors(res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  if (!rateLimit(req)) {
    return res.status(429).json({ ok: false, message: "Too many requests" });
  }

  try {
    const { name, email, companyName, phoneNumber, consent } = req.body || {};
    if (!name || !email || !companyName) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }
    if (consent !== true) {
      return res.status(400).json({ ok: false, message: "Consent is required" });
    }

    const origin = req.headers?.origin || req.headers?.referer;
    const beePromise = subscribeToBeehiiv({
      email,
      name,
      publicationId: process.env.BEEHIIV_PUBLICATION_ID,
      apiKey: process.env.BEEHIIV_API_KEY,
      origin,
    });
    const hubPromise = upsertHubSpotContact({
      email,
      name,
      companyName,
      phoneNumber,
      token: process.env.HUBSPOT_ACCESS_TOKEN,
    });

    const [bee, hub] = await Promise.allSettled([beePromise, hubPromise]);

    const beeResult = bee.status === "fulfilled" ? bee.value : { ok: false, status: 500, message: bee.reason?.message || String(bee.reason) };
    const hubResult = hub.status === "fulfilled" ? hub.value : { ok: false, status: 500, message: hub.reason?.message || String(hub.reason) };

    const ok = beeResult.ok && hubResult.ok;
    return res.status(200).json({ ok, results: { beehiiv: beeResult, hubspot: hubResult } });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Internal error" });
  }
};


