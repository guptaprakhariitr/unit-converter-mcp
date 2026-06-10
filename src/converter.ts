// Unit / currency / timezone / date-arithmetic converter.
// All inline — no upstream calls except for live FX rates (ExchangeRate.host, free, no key).

import { KvCache } from "./cache";

export interface ConverterEnv {
  CACHE: KVNamespace;
  EXCHANGE_BASE: string;            // https://api.exchangerate.host
}

// ── Unit conversion ──────────────────────────────────────────────────────────
// Categories: length, mass, volume, area, time, temperature, energy, pressure,
// speed, data, angle. Numeric factors normalized to a base unit per category.

type UnitDef = { aliases: string[]; toBase: number; offset?: number };

const UNITS: Record<string, Record<string, UnitDef>> = {
  length: {
    meter:      { aliases: ["m", "meters"],        toBase: 1 },
    kilometer:  { aliases: ["km", "kilometers"],   toBase: 1000 },
    centimeter: { aliases: ["cm", "centimeters"],  toBase: 0.01 },
    millimeter: { aliases: ["mm", "millimeters"],  toBase: 0.001 },
    inch:       { aliases: ["in", "inches"],       toBase: 0.0254 },
    foot:       { aliases: ["ft", "feet"],         toBase: 0.3048 },
    yard:       { aliases: ["yd", "yards"],        toBase: 0.9144 },
    mile:       { aliases: ["mi", "miles"],        toBase: 1609.344 },
    nautical_mile: { aliases: ["nmi"],             toBase: 1852 },
  },
  mass: {
    kilogram:  { aliases: ["kg", "kilograms"],     toBase: 1 },
    gram:      { aliases: ["g", "grams"],          toBase: 0.001 },
    milligram: { aliases: ["mg", "milligrams"],    toBase: 0.000001 },
    pound:     { aliases: ["lb", "lbs", "pounds"], toBase: 0.45359237 },
    ounce:     { aliases: ["oz", "ounces"],        toBase: 0.028349523125 },
    ton:       { aliases: ["t", "tons", "tonnes", "metric_ton"], toBase: 1000 },
    stone:     { aliases: ["st", "stones"],        toBase: 6.35029318 },
  },
  volume: {
    liter:      { aliases: ["l", "liters", "L"],    toBase: 1 },
    milliliter: { aliases: ["ml", "milliliters"],   toBase: 0.001 },
    cubic_meter:{ aliases: ["m3"],                  toBase: 1000 },
    gallon_us:  { aliases: ["gal", "gallon"],       toBase: 3.785411784 },
    gallon_uk:  { aliases: ["imp_gal"],             toBase: 4.54609 },
    cup_us:     { aliases: ["cup"],                 toBase: 0.2365882365 },
    tablespoon: { aliases: ["tbsp"],                toBase: 0.0147867648 },
    teaspoon:   { aliases: ["tsp"],                 toBase: 0.0049289216 },
    fluid_ounce:{ aliases: ["fl_oz", "floz"],       toBase: 0.0295735296 },
    pint_us:    { aliases: ["pt", "pint"],          toBase: 0.473176473 },
  },
  area: {
    square_meter:    { aliases: ["m2"],            toBase: 1 },
    square_kilometer:{ aliases: ["km2"],           toBase: 1e6 },
    hectare:         { aliases: ["ha"],            toBase: 10000 },
    acre:            { aliases: ["acres"],         toBase: 4046.8564224 },
    square_foot:     { aliases: ["sqft", "ft2"],   toBase: 0.09290304 },
  },
  time: {
    second:      { aliases: ["s", "sec", "seconds"],   toBase: 1 },
    millisecond: { aliases: ["ms"],                    toBase: 0.001 },
    minute:      { aliases: ["min", "minutes"],        toBase: 60 },
    hour:        { aliases: ["h", "hr", "hours"],      toBase: 3600 },
    day:         { aliases: ["d", "days"],             toBase: 86400 },
    week:        { aliases: ["wk", "weeks"],           toBase: 604800 },
  },
  temperature: {
    kelvin:     { aliases: ["K"], toBase: 1 },
    celsius:    { aliases: ["C"], toBase: 1, offset: 273.15 },
    fahrenheit: { aliases: ["F"], toBase: 5 / 9, offset: 459.67 },          // K = (F + 459.67) * 5/9
  },
  energy: {
    joule:       { aliases: ["J"],         toBase: 1 },
    kilojoule:   { aliases: ["kJ"],        toBase: 1000 },
    calorie:     { aliases: ["cal"],       toBase: 4.184 },
    kilocalorie: { aliases: ["kcal"],      toBase: 4184 },
    watt_hour:   { aliases: ["Wh"],        toBase: 3600 },
    kilowatt_hour:{ aliases: ["kWh"],      toBase: 3600000 },
    btu:         { aliases: ["BTU"],       toBase: 1055.06 },
  },
  speed: {
    meter_per_second:    { aliases: ["m/s", "mps"],   toBase: 1 },
    kilometer_per_hour:  { aliases: ["km/h", "kph"],  toBase: 0.27777777778 },
    mile_per_hour:       { aliases: ["mph"],          toBase: 0.44704 },
    knot:                { aliases: ["kn", "knots"],  toBase: 0.51444444444 },
  },
  data: {
    bit:        { aliases: ["b"],         toBase: 1 },
    byte:       { aliases: ["B"],         toBase: 8 },
    kilobyte:   { aliases: ["KB"],        toBase: 8000 },
    kibibyte:   { aliases: ["KiB"],       toBase: 8192 },
    megabyte:   { aliases: ["MB"],        toBase: 8e6 },
    mebibyte:   { aliases: ["MiB"],       toBase: 8388608 },
    gigabyte:   { aliases: ["GB"],        toBase: 8e9 },
    gibibyte:   { aliases: ["GiB"],       toBase: 8589934592 },
    terabyte:   { aliases: ["TB"],        toBase: 8e12 },
  },
  pressure: {
    pascal:    { aliases: ["Pa"],          toBase: 1 },
    kilopascal:{ aliases: ["kPa"],         toBase: 1000 },
    bar:       { aliases: [],              toBase: 100000 },
    psi:       { aliases: ["PSI"],         toBase: 6894.757293168 },
    atmosphere:{ aliases: ["atm"],         toBase: 101325 },
    mmhg:      { aliases: ["torr"],        toBase: 133.322387415 },
  },
};

export interface ConvertResult {
  input: { value: number; from: string };
  output: { value: number; to: string };
  category: string;
}

export function findUnit(name: string): { category: string; unit: string; def: UnitDef } | null {
  const norm = name.trim().toLowerCase();
  for (const [cat, units] of Object.entries(UNITS)) {
    for (const [unitName, def] of Object.entries(units)) {
      if (unitName === norm) return { category: cat, unit: unitName, def };
      if (def.aliases.map((a) => a.toLowerCase()).includes(norm)) {
        return { category: cat, unit: unitName, def };
      }
    }
  }
  return null;
}

export function convertUnit(value: number, from: string, to: string): ConvertResult {
  const f = findUnit(from);
  const t = findUnit(to);
  if (!f) throw new Error(`Unknown source unit: '${from}'`);
  if (!t) throw new Error(`Unknown target unit: '${to}'`);
  if (f.category !== t.category) throw new Error(`Incompatible units: ${from} (${f.category}) vs ${to} (${t.category})`);

  let inBase: number;
  let outValue: number;
  if (f.category === "temperature") {
    // Temperature uses offset + scale; normalize to Kelvin first.
    inBase = (value + (f.def.offset ?? 0)) * f.def.toBase;
    outValue = inBase / t.def.toBase - (t.def.offset ?? 0);
  } else {
    inBase = value * f.def.toBase;
    outValue = inBase / t.def.toBase;
  }
  return {
    input: { value, from: f.unit },
    output: { value: Number(outValue.toFixed(8)), to: t.unit },
    category: f.category,
  };
}

export function listUnits(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [cat, units] of Object.entries(UNITS)) {
    out[cat] = Object.keys(units);
  }
  return out;
}

// ── Currency conversion ──────────────────────────────────────────────────────

export class CurrencyConverter {
  private cache: KvCache;
  constructor(private env: ConverterEnv) { this.cache = new KvCache(env.CACHE, "fx"); }

  async convert(amount: number, from: string, to: string, date?: string): Promise<{ amount: number; from: string; to: string; rate: number; date: string; source: string }> {
    const F = from.toUpperCase();
    const T = to.toUpperCase();
    if (F === T) return { amount, from: F, to: T, rate: 1, date: date ?? new Date().toISOString().slice(0, 10), source: "identity" };
    const key = `${F}-${T}-${date ?? "latest"}`;
    return this.cache.memoize(key, 60 * 60 * 6, async () => {
      const endpoint = date ? `${this.env.EXCHANGE_BASE}/${date}` : `${this.env.EXCHANGE_BASE}/latest`;
      const r = await fetch(`${endpoint}?base=${F}&symbols=${T}`);
      if (!r.ok) throw new Error(`exchangerate.host ${r.status}`);
      const json: any = await r.json();
      const rate = json?.rates?.[T];
      if (typeof rate !== "number") throw new Error(`No rate returned for ${F}→${T}`);
      return {
        amount: Number((amount * rate).toFixed(6)),
        from: F, to: T,
        rate: Number(rate.toFixed(8)),
        date: json?.date ?? (date ?? new Date().toISOString().slice(0, 10)),
        source: "exchangerate.host",
      };
    });
  }
}

// ── Timezone / date arithmetic ───────────────────────────────────────────────

const COMMON_TZ_OFFSETS: Record<string, number> = {
  "UTC": 0,           "GMT": 0,
  "America/New_York": -5,   "America/Los_Angeles": -8,
  "America/Chicago": -6,    "America/Denver": -7,
  "Europe/London": 0,       "Europe/Paris": 1,         "Europe/Berlin": 1,
  "Asia/Kolkata": 5.5,      "Asia/Tokyo": 9,           "Asia/Singapore": 8,
  "Asia/Shanghai": 8,       "Asia/Dubai": 4,           "Asia/Hong_Kong": 8,
  "Australia/Sydney": 11,   "Pacific/Auckland": 13,
};

export function convertTimezone(iso: string, fromTz: string, toTz: string): { input: { iso: string; tz: string }; output: { iso: string; tz: string }; offset_diff_hours: number } {
  if (!(fromTz in COMMON_TZ_OFFSETS)) throw new Error(`Unknown timezone: ${fromTz}`);
  if (!(toTz in COMMON_TZ_OFFSETS))   throw new Error(`Unknown timezone: ${toTz}`);
  const t = new Date(iso);
  if (isNaN(t.getTime())) throw new Error(`Invalid ISO datetime: ${iso}`);
  const diff = COMMON_TZ_OFFSETS[toTz] - COMMON_TZ_OFFSETS[fromTz];
  // The input ISO is interpreted as being in fromTz. We re-anchor by adding the diff.
  const outDate = new Date(t.getTime() + diff * 3600 * 1000);
  return {
    input: { iso: t.toISOString(), tz: fromTz },
    output: { iso: outDate.toISOString(), tz: toTz },
    offset_diff_hours: diff,
  };
}

export function dateDiff(a: string, b: string, unit = "days"): { from: string; to: string; diff: number; unit: string } {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (isNaN(ta) || isNaN(tb)) throw new Error("Invalid date");
  const ms = tb - ta;
  let diff: number;
  switch (unit) {
    case "ms":      diff = ms;                  break;
    case "seconds": diff = ms / 1000;            break;
    case "minutes": diff = ms / 60000;           break;
    case "hours":   diff = ms / 3600000;         break;
    case "days":    diff = ms / 86400000;        break;
    case "weeks":   diff = ms / (86400000 * 7);  break;
    default: throw new Error(`Unknown unit: ${unit}`);
  }
  return { from: a, to: b, diff: Number(diff.toFixed(4)), unit };
}

export { COMMON_TZ_OFFSETS, UNITS };
