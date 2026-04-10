import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { getCarrier, STUDENTS, PHONE_NUMBERS } from "./contacts";

const app = express();
app.use(express.json());

const GATEWAY_IP   = process.env.GATEWAY_IP   || "192.168.0.181";
const GATEWAY_PORT = process.env.GATEWAY_PORT  || "8080";
const GATEWAY_URL  = `http://${GATEWAY_IP}:${GATEWAY_PORT}/send-sms`;
const DELAY_MS     = Number(process.env.DELAY_MS) || 5000;
const PORT         = Number(process.env.PORT)     || 6000;

// ── Campaign message ───────────────────────────────────────────────────────
// {name} is replaced per recipient at send time.
const CAMPAIGN_MESSAGE = `Hello {name},
Discipline, accountability, and practicality.
No hype. No excuses. Just results.
*VOTE SSERUNJOGI FRANK* for Equipments Secretary - Games Union

Reliable. Practical. Effective.`;

// ── Test mode ──────────────────────────────────────────────────────────────
// true  → sends only to the 15-entry test list (Frank's number, safe to blast)
// false → sends to the real STUDENTS list
const TEST_MODE = false;

const TEST_STUDENTS: typeof STUDENTS = Array.from({ length: 2 }, (_, i) => ({
  sn: i + 1,
  name: "SSERUNJOGI FRANK",
  phone: "0707901583",
  intlPhone: "256707901583",
  school: "SOM",
  carrier: "airtel" as const,
}));

const ACTIVE_STUDENTS = TEST_MODE ? TEST_STUDENTS : STUDENTS;

// ── Sent-log (persisted to JSON) ───────────────────────────────────────────
interface SentRecord {
  sn: number;
  name: string;
  school: string;
  phone: string;
  carrier: string;
  sentAt: string;
}

const SENT_LOG_PATH = path.join(__dirname, "..", "sent.json");

function loadSentLog(): SentRecord[] {
  if (!fs.existsSync(SENT_LOG_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(SENT_LOG_PATH, "utf-8")) as SentRecord[];
  } catch {
    return [];
  }
}

function appendSentRecord(record: SentRecord): void {
  const log = loadSentLog();
  log.push(record);
  fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function sendSms(phone: string, message: string) {
  const res = await axios.post(GATEWAY_URL, { phone, message }, { timeout: 15000 });
  return res.data;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function personalise(template: string, name: string): string {
  return template.replace(/\{name\}/gi, name);
}

// ── GET /status ────────────────────────────────────────────────────────────
app.get("/status", (_req, res) => {
  const mtn     = PHONE_NUMBERS.filter((n) => getCarrier(n) === "mtn").length;
  const airtel  = PHONE_NUMBERS.filter((n) => getCarrier(n) === "airtel").length;
  const noPhone = STUDENTS.filter((s) => s.intlPhone === null).length;
  const sentLog = loadSentLog();
  res.json({
    mode: TEST_MODE ? "TEST" : "LIVE",
    gateway: GATEWAY_URL,
    totalContacts: PHONE_NUMBERS.length,
    mtn,
    airtel,
    noPhone,
    alreadySent: sentLog.length,
    remaining: PHONE_NUMBERS.length - sentLog.length,
  });
});

// ── GET /contacts?carrier=mtn|airtel|all ───────────────────────────────────
app.get("/contacts", (req, res) => {
  const carrier = (req.query.carrier as string) || "all";
  if (!["mtn", "airtel", "all"].includes(carrier)) {
    res.status(400).json({ error: "carrier must be mtn, airtel, or all" });
    return;
  }

  const sentPhones = new Set(loadSentLog().map((r) => r.phone));

  const list = ACTIVE_STUDENTS
    .filter((s) => s.intlPhone !== null)
    .filter((s) => carrier === "all" || s.carrier === carrier)
    .map((s) => ({
      sn: s.sn,
      name: s.name,
      school: s.school,
      carrier: s.carrier,
      phone: s.intlPhone,
      sent: sentPhones.has(s.intlPhone!),
    }));

  res.json({ mode: TEST_MODE ? "TEST" : "LIVE", carrier, count: list.length, contacts: list });
});

// ── GET /sent ──────────────────────────────────────────────────────────────
app.get("/sent", (_req, res) => {
  const log = loadSentLog();
  res.json({ total: log.length, records: log });
});

// ── POST /send ─────────────────────────────────────────────────────────────
// Body: { carrier: "mtn" | "airtel" | "all" }
// Skips contacts already in sent.json. Writes each success to disk immediately.
app.post("/send", async (req, res) => {
  const { carrier = "all" } = req.body as { carrier?: string };

  if (!["mtn", "airtel", "all"].includes(carrier)) {
    res.status(400).json({ error: "carrier must be mtn, airtel, or all" });
    return;
  }

  const sentPhones = new Set(loadSentLog().map((r) => r.phone));

  const targets = ACTIVE_STUDENTS.filter(
    (s) =>
      s.intlPhone !== null &&
      (carrier === "all" || s.carrier === carrier) &&
      !sentPhones.has(s.intlPhone!)
  ) as (typeof STUDENTS[number] & { intlPhone: string })[];

  const skipped = ACTIVE_STUDENTS.filter(
    (s) => s.intlPhone !== null && sentPhones.has(s.intlPhone!)
  ).length;

  if (targets.length === 0) {
    res.json({ message: "Nothing to send — all contacts already received this message.", skipped });
    return;
  }

  console.log(`\n[${TEST_MODE ? "TEST" : "LIVE"}] Sending to ${targets.length} ${carrier} contacts (${skipped} skipped)...\n`);

  const results: {
    sn: number; name: string; school: string; phone: string;
    status: "sent" | "failed"; error?: string;
  }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const student = targets[i];
    const text = personalise(CAMPAIGN_MESSAGE, student.name);
    try {
      await sendSms(student.intlPhone, text);
      appendSentRecord({
        sn: student.sn,
        name: student.name,
        school: student.school,
        phone: student.intlPhone,
        carrier: student.carrier,
        sentAt: new Date().toISOString(),
      });
      results.push({ sn: student.sn, name: student.name, school: student.school, phone: student.intlPhone, status: "sent" });
      console.log(`  ✅ [${i + 1}/${targets.length}] ${student.name} — ${student.intlPhone}`);
    } catch (err) {
      const errMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err);
      results.push({ sn: student.sn, name: student.name, school: student.school, phone: student.intlPhone, status: "failed", error: errMsg });
      console.log(`  ❌ [${i + 1}/${targets.length}] ${student.name} — FAILED: ${errMsg}`);
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  const sent   = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(`\nDone: ${sent} sent, ${failed} failed, ${skipped} skipped\n`);

  res.json({ mode: TEST_MODE ? "TEST" : "LIVE", carrier, total: targets.length, sent, failed, skipped, results });
});

// ── POST /send-one ─────────────────────────────────────────────────────────
// Body: { phone: string }
app.post("/send-one", async (req, res) => {
  const { phone } = req.body as { phone?: string };

  if (!phone) {
    res.status(400).json({ error: "phone is required" });
    return;
  }

  const student = ACTIVE_STUDENTS.find((s) => s.intlPhone === phone || s.phone === phone);
  const text = personalise(CAMPAIGN_MESSAGE, student ? student.name : "");

  try {
    const data = await sendSms(phone, text);
    if (student) {
      appendSentRecord({
        sn: student.sn,
        name: student.name,
        school: student.school,
        phone,
        carrier: student.carrier,
        sentAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Sent to ${phone}${student ? ` — ${student.name}` : ""}`);
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
  const sentCount = loadSentLog().length;
  console.log(`
SMS Gateway Server  [${TEST_MODE ? "TEST MODE — 15 test entries" : "LIVE MODE — real contacts"}]
http://localhost:${PORT}

Endpoints:
  GET  /status              — gateway info, contact counts & send progress
  GET  /contacts?carrier=   — list contacts with sent status (mtn | airtel | all)
  GET  /sent                — full log of successfully sent messages
  POST /send                — bulk send { carrier: "mtn"|"airtel"|"all" }
  POST /send-one            — single send { phone }

Sent log: ${SENT_LOG_PATH}  (${sentCount} sent so far)
Gateway:  ${GATEWAY_URL}
Delay:    ${DELAY_MS}ms between messages
  `);
});
