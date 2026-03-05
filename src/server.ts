import express from "express";
import axios from "axios";
import { filterByCarrier, getCarrier, PHONE_NUMBERS, type Carrier } from "./contacts";

const app = express();
app.use(express.json());

// ── Config ─────────────────────────────────────────────────────────────────
const GATEWAY_IP = process.env.GATEWAY_IP || "192.168.100.6";
const GATEWAY_PORT = process.env.GATEWAY_PORT || "8080";
const GATEWAY_URL = `http://${GATEWAY_IP}:${GATEWAY_PORT}/send-sms`;
const DELAY_MS = Number(process.env.DELAY_MS) || 1000; // 1 second between sends
const PORT = Number(process.env.PORT) || 6000;

// ── Helper: send one SMS via the phone gateway ────────────────────────────
async function sendSms(phone: string, message: string) {
  const res = await axios.post(GATEWAY_URL, { phone, message }, { timeout: 15000 });
  return res.data;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── GET /status ────────────────────────────────────────────────────────────
app.get("/status", (_req, res) => {
  const mtn = PHONE_NUMBERS.filter((n) => getCarrier(n) === "mtn");
  const airtel = PHONE_NUMBERS.filter((n) => getCarrier(n) === "airtel");
  res.json({
    gateway: GATEWAY_URL,
    totalContacts: PHONE_NUMBERS.length,
    mtn: mtn.length,
    airtel: airtel.length,
  });
});

// ── GET /contacts?carrier=mtn|airtel|all ───────────────────────────────────
app.get("/contacts", (req, res) => {
  const carrier = (req.query.carrier as string) || "all";
  if (!["mtn", "airtel", "all"].includes(carrier)) {
    res.status(400).json({ error: "carrier must be mtn, airtel, or all" });
    return;
  }
  const numbers = filterByCarrier(carrier as Carrier | "all");
  res.json({ carrier, count: numbers.length, numbers });
});

// ── POST /send ─────────────────────────────────────────────────────────────
// Body: { message: string, carrier: "mtn" | "airtel" | "all" }
// Sends the message to all contacts of the selected carrier, 1 per second.
app.post("/send", async (req, res) => {
  const { message, carrier = "all" } = req.body as {
    message?: string;
    carrier?: string;
  };

  if (!message || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (!["mtn", "airtel", "all"].includes(carrier)) {
    res.status(400).json({ error: "carrier must be mtn, airtel, or all" });
    return;
  }

  const numbers = filterByCarrier(carrier as Carrier | "all");
  if (numbers.length === 0) {
    res.status(404).json({ error: "No contacts found for this carrier" });
    return;
  }

  console.log(`\n📤 Sending "${message}" to ${numbers.length} ${carrier} contacts...\n`);

  const results: { phone: string; status: "sent" | "failed"; error?: string }[] = [];
let newMsg=`Greetings. 

You are warmly invited to the wedding preparatory meetings for Mr. and Mrs. Ndawula Francis Bob.

Meetings take place every Sunday at 4:00 PM at their residence in Bunamwaya Ngobe. 
We look forward to your presence and support as we prepare for the wedding on 18th April.

If you are unable to attend, please send your inquiries to:
Ndawula Francis Bob:0702716544.
Nalubanyi Caroline:0700547445


Nkulamusiza ssebo oba nyabo. 
Tukwaniriza mu nkungaana z'embaga y'omwami n'omukyala Ndawula Francis Bob enaabaawo nga 18th April.
Enkugaana zibeera wo bbuli lwa ssabbiiti(SANDE) ku ssawa kkumi eza kuwungezi(4:00PM) mu mmaka gaabwe e Bunamwaya Ngobe.

Okwebuuzako tuukirira:
Ndawula Francis Bob:0702716544.
Nalubanyi Caroline:0700547445`
  for (let i = 0; i < numbers.length; i++) {
    const phone = numbers[i];
    try {
      await sendSms(phone, newMsg.trim());
      results.push({ phone, status: "sent" });
      console.log(`  ✅ [${i + 1}/${numbers.length}] ${phone} — sent`);
    } catch (err) {
      const errMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err);
      results.push({ phone, status: "failed", error: errMsg });
      console.log(`  ❌ [${i + 1}/${numbers.length}] ${phone} — failed: ${errMsg}`);
    }

    // Wait between sends (skip after last)
    if (i < numbers.length - 1) await sleep(DELAY_MS);
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n✅ Done: ${sent} sent, ${failed} failed\n`);

  res.json({
    carrier,
    total: numbers.length,
    sent,
    failed,
    results,
  });
});

// ── POST /send-one ─────────────────────────────────────────────────────────
// Body: { phone: string, message: string }
// Send a single SMS to a specific number.
app.post("/send-one", async (req, res) => {
  const { phone, message } = req.body as { phone?: string; message?: string };

  if (!phone || !message) {
    res.status(400).json({ error: "phone and message are required" });
    return;
  }

  try {
    const data = await sendSms(phone, message.trim());
    console.log(`✅ Sent to ${phone}`);
    res.json({ phone, status: "sent", gatewayResponse: data });
  } catch (err) {
    const errMsg = axios.isAxiosError(err)
      ? err.response?.data?.message || err.message
      : String(err);
    console.log(`❌ Failed to send to ${phone}: ${errMsg}`);
    res.status(502).json({ phone, status: "failed", error: errMsg });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
🚀 SMS Gateway Server running on http://localhost:${PORT}

Endpoints:
  GET  /status              — gateway info & contact counts
  GET  /contacts?carrier=   — list contacts (mtn | airtel | all)
  POST /send                — bulk send { message, carrier: "mtn"|"airtel"|"all" }
  POST /send-one            — single send { phone, message }

Gateway: ${GATEWAY_URL}
Delay:   ${DELAY_MS}ms between messages
  `);
});
