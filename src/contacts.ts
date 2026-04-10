// ── Carrier detection ──────────────────────────────────────────────────────
export type Carrier = "mtn" | "airtel";

// MTN Uganda prefixes (local 07xx → 2567xx): 077, 078, 076, 079, 039
const MTN_PREFIXES = ["25677", "25678", "25676", "25679", "25639"];
// Airtel Uganda prefixes (local 07xx → 2567xx): 070, 075, 074, 071, 073
const AIRTEL_PREFIXES = ["25670", "25675", "25674", "25671", "25673"];

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
  // COLLEGE OF HEALTH SCIENCES
  { sn: 1,   name: "LUBEGA JOEL COLLINS",          phone: "0757323816", school: "SHS"    },
  { sn: 2,   name: "DENG MAJOK DENG",              phone: "0777206745", school: "SHS"    },
  { sn: 3,   name: "MUSINGUZI PETER SIMON",        phone: "0778103580", school: "SHS"    },
  { sn: 4,   name: "KABUYE JOHN JOASH",            phone: "0704646546", school: "SHS"    },
  { sn: 5,   name: "NAKAVUZA GERTRUDE NOELA",      phone: "0708770594", school: "SHS"    },
  { sn: 6,   name: "AHOMUGISHA JAVIRAH",           phone: "0708201013", school: "SOM"    },
  { sn: 7,   name: "LUBEGA KASSIM",                phone: "0751155495", school: "SOM"    },
  { sn: 8,   name: "ELUNGAT JAMES",                phone: "0753788716", school: "SOM"    },
  { sn: 9,   name: "SSERUNJOGI FRANK",             phone: "0707901583", school: "SOM"    },
  { sn: 10,  name: "AHUMUZA BRONIA",               phone: "0743436447", school: "SOM"    },
  { sn: 11,  name: "MONDO DANIEL",                 phone: "0766550105", school: "DENTAL" },
  { sn: 12,  name: "OJULA EMMANUEL",               phone: "0758326296", school: "DENTAL" },
  { sn: 13,  name: "NASSALI AGNES",                phone: "0756313120", school: "DENTAL" },
  { sn: 14,  name: "MUSENE SHAKIRAH NABWEYE",      phone: "0776611950", school: "DENTAL" },
  { sn: 15,  name: "MUNGUDIT MOSES",               phone: "0769371181", school: "DENTAL" },
  { sn: 16,  name: "ALONG NEHEMIAH OTIM",          phone: "0770905830", school: "BSB"    },
  { sn: 17,  name: "OGIRE JOHN BAPTIST",           phone: "0778479761", school: "BSB"    },
  { sn: 18,  name: "SSEKITOLEKO SHAFIC",           phone: "0760490700", school: "BSB"    },
  { sn: 19,  name: "ASIIMWE ANITA",                phone: "0773358871", school: "BSB"    },
  { sn: 20,  name: "NANDAWULA ALICE",              phone: "0740749074", school: "BSB"    },
  { sn: 21,  name: "SSEMIRIMU JOSEPH",             phone: "0708211962", school: "BSB"    },

  // SCHOOL OF PUBLIC HEALTH
  { sn: 22,  name: "ALIGO GODFREY",                phone: "0780250568", school: "SPH"    },
  { sn: 23,  name: "OMAGOR CHARLES",               phone: "0758441383", school: "SPH"    },
  { sn: 24,  name: "KITAKA HUDSON",                phone: "0707130048", school: "SPH"    },
  { sn: 25,  name: "NAKASI BERNA",                 phone: "0746677533", school: "SPH"    },
  { sn: 26,  name: "SSENABULYA MUNIRUH",           phone: "0789948687", school: "SPH"    },

  // SCHOOL OF LAW
  { sn: 27,  name: "ARINDA PEARL",                 phone: "0741268274", school: "SOL"    },
  { sn: 28,  name: "KAYONDO SAMWIRI",              phone: "0709599771", school: "SOL"    },
  { sn: 29,  name: "RUYANGE MATTHEW",              phone: "0709369169", school: "SOL"    },
  { sn: 30,  name: "BUTEME DORCUS",                phone: "0760514025", school: "SOL"    },
  { sn: 31,  name: "MUTESI PATRICIA ANGEL",        phone: "0787014125", school: "SOL"    },

  // COLLEGE OF NATURAL SCIENCES
  { sn: 32,  name: "JULIET KISAKYE",               phone: "0771059368", school: "SPS"    },
  { sn: 33,  name: "RAKARA ANDREW",                phone: "0770763777", school: "SPS"    },
  { sn: 34,  name: "AFIAN NAGASHA",                phone: "0750197941", school: "SPS"    },
  { sn: 35,  name: "AMPAIRE NAMANYA NIMUSIIMA",    phone: "0758650216", school: "SPS"    },
  { sn: 36,  name: "MANGENI NATHAN",               phone: "0791501700", school: "BIO"    },
  { sn: 37,  name: "AJUKA TRUST",                  phone: "0772103831", school: "BIO"    },
  { sn: 38,  name: "ABAASA DANIEL",                phone: "0781098111", school: "BIO"    },
  { sn: 39,  name: "ATWONGYERE ROBINSON",          phone: "0767370398", school: "BIO"    },
  { sn: 40,  name: "TWINOMUJONI HANNING",          phone: "0750880092", school: "BIO"    },
  { sn: 41,  name: "NANDIMBE FAITH RONAH",         phone: "0758835075", school: "BIO"    },

  // COLLEGE OF EDUCATION AND EXTERNAL STUDIES
  { sn: 42,  name: "KUSASIRA LIVINGSTONE",         phone: "0772115973", school: "SOE"    },
  { sn: 43,  name: "NABISUBI ROY OLIVIA",          phone: "0700242275", school: "SOE"    },
  { sn: 44,  name: "NALWOGGA JOVIA",               phone: "0702804945", school: "SOE"    },
  { sn: 45,  name: "OWOR SILVER",                  phone: "0703412169", school: "SOE"    },
  { sn: 46,  name: "MUKISA LIVINGSTONE",           phone: null,         school: "SOE"    },
  { sn: 47,  name: "BATAMULIZA REDEMPTOR LILLIAN", phone: "0757442893", school: "SDLS"   },
  { sn: 48,  name: "MIREMBE MARIA",                phone: "0767323376", school: "SDLS"   },
  { sn: 49,  name: "BWANIKA FREDRICK",             phone: "0760043488", school: "SDLS"   },
  { sn: 50,  name: "MUTUNZI SIMON RAYMOND",        phone: "0702166323", school: "SDLS"   },
  { sn: 51,  name: "ONORIA JOSEPH MICHAEL",        phone: "0759479305", school: "SDLS"   },

  // COLLEGE OF COMPUTING AND INFORMATION SCIENCES
  { sn: 52,  name: "ABENAITWE CAROLINE",           phone: null,         school: "EASLIS" },
  { sn: 53,  name: "AYIKORU LAIURE",               phone: "0746494967", school: "EASLIS" },
  { sn: 54,  name: "NIYONSHUTI RODRIC",            phone: "0741216605", school: "EASLIS" },
  { sn: 55,  name: "JAKUMA PIUS",                  phone: "0740582023", school: "EASLIS" },
  { sn: 56,  name: "MUSOBYA UMAR",                 phone: null,         school: "EASLIS" },
  { sn: 57,  name: "MUTESASIRA TENDO SHAMMAH",     phone: "0791199978", school: "SCIT"   },
  { sn: 58,  name: "TAMALE VALERIAN",              phone: "0744397362", school: "SCIT"   },
  { sn: 59,  name: "MUWONGE NICHOLAS",             phone: "0707611985", school: "SCIT"   },
  { sn: 60,  name: "AMABE JUNIOR HUMPHREY",        phone: "0780566352", school: "SCIT"   },

  // COLLEGE OF BUSINESS AND MANAGEMENT STUDIES
  { sn: 61,  name: "AKANKUNDA ANITAH",             phone: "0756649271", school: "SOE"    },
  { sn: 62,  name: "KAYESU DEBORAH",               phone: "0787051515", school: "SOE"    },
  { sn: 63,  name: "MUBIRU DAVIS PAUL",            phone: "0757809596", school: "SOE"    },
  { sn: 64,  name: "SHILLING GILLES",              phone: "0748598738", school: "SOE"    },
  { sn: 65,  name: "NAGAWA FAVOR TEDDY",           phone: "0743039006", school: "SOE"    },
  { sn: 66,  name: "MUKALAZI MUSA",                phone: "0768658481", school: "SOE"    },
  { sn: 67,  name: "KEKITINISA BLESSING",          phone: "0754661129", school: "SOB"    },
  { sn: 68,  name: "ARINDA LEONARD CLAVER",        phone: "0768631405", school: "SOB"    },
  { sn: 69,  name: "AINAMAANI DAVID",              phone: "0706784452", school: "SOB"    },
  { sn: 70,  name: "EKYOKUSIIMA ELIZABETH",        phone: "0744645858", school: "SOB"    },
  { sn: 71,  name: "ATWEBEMBEIRE PATIENCE",        phone: "0780905290", school: "SOB"    },
  { sn: 72,  name: "NAHWERA EDWARD",               phone: "0740835117", school: "SOB"    },
  { sn: 73,  name: "KATEREGGA MICHAEL MAYANJA",    phone: "0730815205", school: "SSP"    },
  { sn: 74,  name: "MUYOMBA MICHAEL",              phone: "0706284584", school: "SSP"    },
  { sn: 75,  name: "NAKACIWA JOCELYN",             phone: "0774817198", school: "SSP"    },
  { sn: 76,  name: "NINSIMA EVELYN",               phone: null,         school: "SSP"    },

  // COLLEGE OF VETERINARY, ANIMAL RESOURCES AND BIOSECURITY
  { sn: 77,  name: "AWOR REBECCA",                 phone: "0748817198", school: "SVAR"   },
  { sn: 78,  name: "MUGABE ALI KASAJJA",           phone: "0726871055", school: "SVAR"   },
  { sn: 79,  name: "MAANGIE GRANT",                phone: "0736715808", school: "SVAR"   },
  { sn: 80,  name: "AYOTO GLORIA MERCY",           phone: "0763974824", school: "SVAR"   },
  { sn: 81,  name: "NABADDA LILIAN",               phone: "0751154526", school: "SVAR"   },
  { sn: 82,  name: "NAKIBIRANOO TRACY",            phone: "0700777445", school: "SHLS"   },
  { sn: 83,  name: "MUHUMUZA BENON",               phone: "0744069359", school: "SHLS"   },
  { sn: 84,  name: "OPIO ROGERS",                  phone: "0705162308", school: "SHLS"   },
  { sn: 85,  name: "LUKWAGO JONAH",                phone: "0786581288", school: "SHLS"   },
  { sn: 86,  name: "NAMAGEMBE SUZAN",              phone: "0754128465", school: "SHLS"   },

  // COLLEGE OF ENGINEERING, DESIGN ART AND TECHNOLOGY
  { sn: 87,  name: "ABAASA BLESSING",              phone: "0760754805", school: "SBE"    },
  { sn: 88,  name: "AKAIJAGYE CECILIA",            phone: "0765780425", school: "SBE"    },
  { sn: 89,  name: "ATUKWATSE DICKENS",            phone: "0701704945", school: "SBE"    },
  { sn: 90,  name: "NIWAGABA IVAN",                phone: "0790704167", school: "SBE"    },
  { sn: 91,  name: "IOWKUHANGI CHRISTIANA",        phone: "0708968856", school: "SBE"    },
  { sn: 92,  name: "BARAGAIRE DORCAH",             phone: "0757229613", school: "SOE"    },
  { sn: 93,  name: "AYEBALE JOHN MOSIIMENTA",      phone: "0784693644", school: "SOE"    },
  { sn: 94,  name: "MUKUNGI MICHAEL NSAMBA",       phone: "0767376566", school: "SOE"    },
  { sn: 95,  name: "NAHURIRA RUTH",                phone: "0778429005", school: "SOE"    },
  { sn: 96,  name: "ANTHONY MICHAEL PAULINO",      phone: "0768190576", school: "SOE"    },
  { sn: 97,  name: "KAMBERE CELINA",               phone: "0772498164", school: "MTSIFA" },
  { sn: 98,  name: "OKUMU TOMMY",                  phone: "0791276671", school: "MTSIFA" },
  { sn: 99,  name: "APOLOT ASHA",                  phone: "0771614759", school: "MTSIFA" },
  { sn: 100, name: "OMITA AMOS",                   phone: "0758473614", school: "MTSIFA" },
  { sn: 101, name: "WESONGA WINNER DEBORAH",       phone: "0700781722", school: "MTSIFA" },

  // COLLEGE OF AGRICULTURE AND ENVIRONMENTAL SCIENCES
  { sn: 103, name: "SSEKASAMBA REAGAN",            phone: "0759002286", school: "SFTNB"  },
  { sn: 104, name: "NABAASA SYLVIA",               phone: "0759013382", school: "SFTNB"  },
  { sn: 105, name: "ODONGO AUSTIN",                phone: "0777438683", school: "SFTNB"  },
  { sn: 106, name: "SSENDAGIRE ENOCK",             phone: "0701958295", school: "SFTNB"  },
  { sn: 107, name: "SSENGENDO BRIGHTON",           phone: "0756542764", school: "SFTNB"  },
  { sn: 108, name: "ALESI PERRY",                  phone: "0793663781", school: "SAS"    },
  { sn: 109, name: "ACAI STEVEN",                  phone: "0766727480", school: "SAS"    },
  { sn: 110, name: "MUNGUNGEYO BENEDICT",          phone: "0762523518", school: "SAS"    },
  { sn: 111, name: "MUWAYA ENOCK SAMUEL",          phone: "0702088408", school: "SAS"    },
  { sn: 112, name: "MUGERWA JOHN PATRICK",         phone: "0773441338", school: "SAS"    },
  { sn: 113, name: "ARIMPA AGATHA",                phone: "0754814620", school: "SFEGS"  },
  { sn: 114, name: "CHERUKUT SHAMMA",              phone: "0780519135", school: "SFEGS"  },
  { sn: 115, name: "KASASA JOVAN PAUL",            phone: "0776387291", school: "SFEGS"  },
  { sn: 116, name: "LUBABENE ROZZY ROJUST",        phone: "0771890348", school: "SFEGS"  },
  { sn: 117, name: "KAZIBA TIMOTHY",               phone: "0752369586", school: "SFEGS"  },

  // COLLEGE OF HUMANITIES AND SOCIAL SCIENCES
  { sn: 118, name: "ASIIMWE RITAH",                phone: "0750082623", school: "SLLC"   },
  { sn: 119, name: "NAMULONDO LAYIRAH",            phone: "0705443289", school: "SLLC"   },
  { sn: 120, name: "BORN FRANK",                   phone: "0706005808", school: "SLLC"   },
  { sn: 121, name: "GALABUZI MATHIAS",             phone: "0774533299", school: "SLLC"   },
  { sn: 122, name: "OTUKUNDA FAITH",               phone: null,         school: "SLLC"   },
  { sn: 123, name: "MATEKA AARON",                 phone: "0701326241", school: "SLPA"   },
  { sn: 124, name: "ANKUNDA SHEILAH",              phone: "0771766507", school: "SLPA"   },
  { sn: 125, name: "NAAVA ANITA",                  phone: "0760886361", school: "SLPA"   },
  { sn: 126, name: "KALUNGI VIOLET",               phone: "0760870433", school: "SLPA"   },
  { sn: 127, name: "KAVUMA ARAFAT YUSUF",          phone: "0753353244", school: "SLPA"   },
  { sn: 128, name: "ATURE RUNGANO",                phone: "0775144861", school: "SOP"    },
  { sn: 129, name: "BUKENYA ELIJAH PATIENCE",      phone: "0762678679", school: "SOP"    },
  { sn: 130, name: "KABUUSI WILLIAM",              phone: "0700760442", school: "SOP"    },
  { sn: 131, name: "NAMAGEMBE CHRISTINE",          phone: "0778038697", school: "SOP"    },
  { sn: 132, name: "WABWIRE JUMA ARSHAVIN",        phone: "0759600047", school: "SOP"    },
  { sn: 133, name: "ATUHAIRE ANNET",               phone: "0770543107", school: "SOSS"   },
  { sn: 134, name: "NASSANGA SARAH",               phone: "0709116086", school: "SOSS"   },
  { sn: 135, name: "ATUKUNDA SHIBAH",              phone: "0744130058", school: "SOSS"   },
  { sn: 136, name: "BARAJI SOLOMON MANDELA",       phone: "0752813704", school: "SOSS"   },
  { sn: 137, name: "RUSOKE IVAN",                  phone: "0744352234", school: "SOSS"   },
  { sn: 138, name: "BIIRA CLOPHAS MUSABE",         phone: "0763996008", school: "GENDER" },
  { sn: 139, name: "NAMPEERA JENIFER",             phone: "0742024341", school: "GENDER" },
  { sn: 140, name: "EYOTIA RAYMOND",               phone: "0767601310", school: "GENDER" },
  { sn: 141, name: "NATUMANYA MARIA LYNETTE",      phone: "0752591653", school: "GENDER" },
  { sn: 142, name: "SENTEZA JOSHUA",               phone: null,         school: "GENDER" },
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
