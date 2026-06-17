// send-code.js — texts a one-time code via Twilio Verify.
// Secrets come from Netlify Environment Variables (set once), never from the browser.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function toE164(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return "+" + d;
  if (d.length === 10) return "+1" + d;            // assume US/CA
  return raw && raw[0] === "+" ? raw : "+" + d;
}
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method not allowed" };
  try {
    const { phone } = JSON.parse(event.body || "{}");
    if (!phone) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Missing phone" }) };
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const service = process.env.TWILIO_VERIFY_SERVICE_SID;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: toE164(phone), Channel: "sms" }),
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: (data.code ? ("["+data.code+"] ") : "") + (data.message || "send failed") }) };
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, status: data.status }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "server error" }) };
  }
};
