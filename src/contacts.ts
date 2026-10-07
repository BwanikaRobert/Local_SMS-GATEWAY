// ── Carrier detection ──────────────────────────────────────────────────────
export type Carrier = "mtn" | "airtel";

// MTN Uganda prefixes (local 07xx → 2567xx): 077, 078, 076, 079, 039
const MTN_PREFIXES = ["25677", "25678", "25676", "25679", "25639"];
// Airtel Uganda prefixes (local 07xx → 2567xx): 070, 075, 074, 071, 073
const AIRTEL_PREFIXES = ["25670", "25675", "25674", "25671", "25673","25620"];

export function getCarrier(phone: string): Carrier | "unknown" {
  const digits = phone.replace(/\D/g, "");
  if (MTN_PREFIXES.some((p) => digits.startsWith(p))) return "mtn";
  if (AIRTEL_PREFIXES.some((p) => digits.startsWith(p))) return "airtel";
  return "unknown";
}

/** Normalise a local Ugandan number (07xxxxxxxxx) to international (256xxxxxxxxx) */
function toIntl(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("256")) return d;
  if (d.startsWith("0")) return "256" + d.slice(1);
  return "256" + d;
}

export function filterByCarrier(carrier: Carrier | "all"): string[] {
  if (carrier === "all") return PHONE_NUMBERS;
  return PHONE_NUMBERS.filter((n) => getCarrier(n) === carrier);
}

// ── Student contacts ───────────────────────────────────────────────────────
export interface Student {
  sn: number;
  name: string;
  phone: string | null;       // null = no number on record
  school: string;
  carrier: Carrier | "unknown";
  intlPhone: string | null;   // E.164-style: 256xxxxxxxxx
}

const RAW_STUDENTS: Omit<Student, "carrier" | "intlPhone">[] = [
  // AIRTEL SIMS -- one per tracker; `name` is the tracker's IMEI
  { sn: 1,  name: "869343040036679", phone: "0207071450", school: "TRACKER" },
  { sn: 2,  name: "869343040036687", phone: "0207071445", school: "TRACKER" },
  { sn: 3,  name: "869343040036794", phone: "0207071485", school: "TRACKER" },
  { sn: 4,  name: "869343040037024", phone: "0207071444", school: "TRACKER" },
  { sn: 5,  name: "869343040037123", phone: "0207071441", school: "TRACKER" },
  { sn: 6,  name: "869343040037289", phone: "0207071460", school: "TRACKER" },
  { sn: 7,  name: "869343040037313", phone: "0207071437", school: "TRACKER" },
  { sn: 8,  name: "869343040037362", phone: "0207071473", school: "TRACKER" },
  { sn: 9,  name: "869343040037453", phone: "0207071447", school: "TRACKER" },
  { sn: 10, name: "869343040037479", phone: "0207071448", school: "TRACKER" },
  { sn: 11, name: "869343040076600", phone: "0207071454", school: "TRACKER" },
  { sn: 12, name: "869343040077822", phone: "0207071452", school: "TRACKER" },
  { sn: 13, name: "869343040080040", phone: "0207071438", school: "TRACKER" },
  { sn: 14, name: "869343040080057", phone: "0207071477", school: "TRACKER" },
  { sn: 15, name: "869343040080149", phone: "0207071443", school: "TRACKER" },
  { sn: 16, name: "869343040080180", phone: "0207071431", school: "TRACKER" },
  { sn: 17, name: "869343040080362", phone: "0207071446", school: "TRACKER" },
  { sn: 18, name: "869343040081568", phone: "0207071506", school: "TRACKER" },
  { sn: 19, name: "869343040081576", phone: "0207071439", school: "TRACKER" },
  { sn: 20, name: "869343040081634", phone: "0207071504", school: "TRACKER" },
  { sn: 21, name: "869343040081667", phone: "0207071442", school: "TRACKER" },
  { sn: 22, name: "869343040081758", phone: "0207071449", school: "TRACKER" },
  { sn: 23, name: "869343040081782", phone: "0207071476", school: "TRACKER" },
  { sn: 24, name: "869343040082038", phone: "0207071505", school: "TRACKER" },
  { sn: 25, name: "869343040081109", phone: "0757082687", school: "TRACKER" },
];

export const STUDENTS: Student[] = RAW_STUDENTS.map((s) => {
  const intlPhone = s.phone ? toIntl(s.phone) : null;
  return {
    ...s,
    intlPhone,
    carrier: intlPhone ? getCarrier(intlPhone) : "unknown",
  };
});

// ── Phone numbers (flat list for bulk send) ────────────────────────────────
// Only students with a valid phone number are included.
export const PHONE_NUMBERS: string[] = STUDENTS
  .filter((s): s is Student & { intlPhone: string } => s.intlPhone !== null)
  .map((s) => s.intlPhone);
