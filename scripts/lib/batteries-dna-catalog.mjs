const slugOverrides = {
  bashir: "basir", mushawwir: "musawwir", khafidh: "khafid", mudzill: "mudhill", lathif: "latif",
  azhim: "azim", syakur: "shakur", hafizh: "hafiz", baits: "baith", syahid: "shahid",
  muhshi: "muhsi", majid2: "maajid", zhahir: "zahir", malik_mulk: "malik-al-mulk",
  dzul_jalal: "dhu-al-jalal-wa-l-ikram", dharr: "darr", warits: "warith", rasyid: "rashid",
};
const referenceOnlyCodes = new Set(["mutakabbir", "aliyy", "majid", "majid2", "ahad", "mutaali", "dzul_jalal", "malik_mulk"]);
const capabilityOverrides = {
  razzaq: "compute-resource-provisioning", karim: "policy-based-resource-allocation",
  azhim: "storage-capacity-planning", kabir: "infrastructure-capacity-planning",
  mughni: "capacity-improvement-planning", syakur: "gratitude-capture",
  hamid: "contribution-recognition", wasi: "service-capacity-boundary-reporting",
  muqtadir: "infrastructure-capacity-constraint-evaluation", hakim: "heuristic-decision-support",
  rasyid: "decision-rationale-presentation", matin: "availability-signal-monitoring",
  hayy: "health-check-reporting", samad: "technical-dependency-inventory",
  ghaniyy: "external-dependency-health-monitoring", awwal: "service-initialization",
  akhir: "service-retirement-workflow",
};

export function parseAsmaEntries(source) {
  return [...source.matchAll(/^\s*\{ number: (\d+), code: "([^"]+)", arabic: "([^"]+)", translit: "([^"]+)", term: "([^"]+)", attribute: "([^"]+)", domain: "([^"]+)", wisdom: "([^"]+)" \},?$/gm)]
    .map(([, number, code, arabic, transliteration, label, attribute, domain, wisdom]) => ({
      number: Number(number), code, arabic, transliteration, label, attribute, domain, wisdom,
    }));
}

export const slugForCode = (code) => slugOverrides[code] ?? code.replace(/_/g, "-");
export const isReferenceOnly = (code) => referenceOnlyCodes.has(code);

export function capabilityFor(entry) {
  if (isReferenceOnly(entry.code)) return null;
  if (capabilityOverrides[entry.code]) return capabilityOverrides[entry.code];
  const words = entry.attribute.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return `${words}-${slugForCode(entry.code)}`;
}

export const humanizeDomain = (value) => value
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
  .replace(/([_-])/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();
