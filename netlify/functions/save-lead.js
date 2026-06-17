// save-lead.js — writes a confirmed lead into your Airtable "Leads" table.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method not allowed" };
  try {
    const lead = JSON.parse(event.body || "{}");
    const token = process.env.AIRTABLE_TOKEN;
    const base = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_NAME || "Leads";
    // Diagnostic logging (no secrets printed — only presence/length of the token).
    console.log("save-lead start:", JSON.stringify({
      hasToken: !!token, tokenLen: token ? token.length : 0,
      base: base || "(MISSING)", table: table
    }));
    const fields = {
      "Name": lead.name || "",
      "Email": lead.email || "",
      "Phone": lead.phone || "",
      "Score": typeof lead.successRate === "number" ? lead.successRate : null,
      "Intent": lead.intent || "",
      "Life Adjustment": lead.lifeAdjustment || "",
      "Summary": lead.summary || "",
    };
    const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
    });
    const data = await res.json();
    console.log("airtable response:", res.status, JSON.stringify(data).slice(0, 700));
    if (!res.ok) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: data.error || "airtable failed" }) };
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (e) {
    console.log("save-lead exception:", String(e && e.message ? e.message : e));
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "server error" }) };
  }
};
