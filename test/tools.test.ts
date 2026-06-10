import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertUnit, findUnit, listUnits, convertTimezone, dateDiff, CurrencyConverter } from "../src/converter";
import { McpServer, ToolContext } from "../src/mcp-server";
import { buildTools } from "../src/tools";

class FakeKv {
  store = new Map<string, string>();
  async get(key: string, type?: "text" | "json"): Promise<any> {
    const v = this.store.get(key); if (v === undefined) return null;
    if (type === "json") return JSON.parse(v); return v;
  }
  async put(key: string, value: string): Promise<void> { this.store.set(key, value); }
  async delete(key: string): Promise<void> { this.store.delete(key); }
}

const env = {
  CACHE: new FakeKv() as unknown as KVNamespace,
  USAGE: new FakeKv() as unknown as KVNamespace,
  EXCHANGE_BASE: "https://api.exchangerate.host",
  UPGRADE_URL: "x",
};

describe("findUnit", () => {
  it("matches canonical names", () => {
    expect(findUnit("meter")?.unit).toBe("meter");
    expect(findUnit("celsius")?.unit).toBe("celsius");
  });
  it("matches aliases case-insensitively", () => {
    expect(findUnit("KM")?.unit).toBe("kilometer");
    expect(findUnit("lbs")?.unit).toBe("pound");
    expect(findUnit("mph")?.unit).toBe("mile_per_hour");
  });
  it("returns null for unknown", () => {
    expect(findUnit("smoot")).toBeNull();
  });
});

describe("convertUnit — length, mass, volume, area, time, energy, speed, data, pressure", () => {
  it("100 km → miles ≈ 62.137", () => {
    expect(convertUnit(100, "km", "miles").output.value).toBeCloseTo(62.137, 2);
  });
  it("1 lb → grams ≈ 453.592", () => {
    expect(convertUnit(1, "lb", "g").output.value).toBeCloseTo(453.592, 2);
  });
  it("1 cup → ml ≈ 236.588", () => {
    expect(convertUnit(1, "cup", "ml").output.value).toBeCloseTo(236.588, 2);
  });
  it("1 hectare → acres ≈ 2.4711", () => {
    expect(convertUnit(1, "hectare", "acres").output.value).toBeCloseTo(2.4711, 3);
  });
  it("3600 seconds → hours = 1", () => {
    expect(convertUnit(3600, "seconds", "hours").output.value).toBeCloseTo(1, 5);
  });
  it("1 kWh → joules = 3,600,000", () => {
    expect(convertUnit(1, "kWh", "J").output.value).toBeCloseTo(3600000, 0);
  });
  it("100 mph → km/h ≈ 160.93", () => {
    expect(convertUnit(100, "mph", "kph").output.value).toBeCloseTo(160.934, 2);
  });
  it("1 GB → MiB ≈ 953.674", () => {
    expect(convertUnit(1, "GB", "MiB").output.value).toBeCloseTo(953.6743, 2);
  });
  it("1 atm → psi ≈ 14.6959", () => {
    expect(convertUnit(1, "atm", "psi").output.value).toBeCloseTo(14.6959, 3);
  });
});

describe("convertUnit — temperature (offset handling)", () => {
  it("0°C → 32°F", () => {
    expect(convertUnit(0, "C", "F").output.value).toBeCloseTo(32, 1);
  });
  it("100°C → 212°F", () => {
    expect(convertUnit(100, "C", "F").output.value).toBeCloseTo(212, 1);
  });
  it("0°K → -273.15°C", () => {
    expect(convertUnit(0, "K", "C").output.value).toBeCloseTo(-273.15, 1);
  });
  it("-40°C ↔ -40°F (the only common point)", () => {
    expect(convertUnit(-40, "C", "F").output.value).toBeCloseTo(-40, 1);
  });
});

describe("convertUnit — error paths", () => {
  it("rejects unknown source unit", () => {
    expect(() => convertUnit(1, "smoot", "m")).toThrow(/Unknown source unit/);
  });
  it("rejects unknown target unit", () => {
    expect(() => convertUnit(1, "m", "smoot")).toThrow(/Unknown target unit/);
  });
  it("rejects cross-category conversion", () => {
    expect(() => convertUnit(1, "kg", "m")).toThrow(/Incompatible/);
  });
});

describe("listUnits", () => {
  it("returns all 10 categories", () => {
    const u = listUnits();
    expect(Object.keys(u).length).toBeGreaterThanOrEqual(10);
    expect(u.length).toContain("meter");
    expect(u.mass).toContain("kilogram");
  });
});

describe("convertTimezone", () => {
  it("UTC noon → America/New_York (5h offset)", () => {
    const r = convertTimezone("2026-06-09T12:00:00Z", "UTC", "America/New_York");
    expect(r.offset_diff_hours).toBe(-5);
    expect(r.output.iso).toMatch(/2026-06-09T07:00/);
  });
  it("rejects unknown tz", () => {
    expect(() => convertTimezone("2026-01-01T00:00:00Z", "UTC", "Mars/Olympus")).toThrow(/Unknown timezone/);
  });
});

describe("dateDiff", () => {
  it("computes days between two dates", () => {
    expect(dateDiff("2026-01-01", "2026-01-08").diff).toBeCloseTo(7, 4);
  });
  it("hours", () => {
    expect(dateDiff("2026-06-10T00:00:00Z", "2026-06-10T06:00:00Z", "hours").diff).toBeCloseTo(6, 4);
  });
});

describe("CurrencyConverter", () => {
  beforeEach(() => {
    (env.CACHE as any).store = new Map();
    vi.stubGlobal("fetch", async (url: string | URL) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.includes("/latest?base=USD&symbols=INR")) {
        return new Response(JSON.stringify({ date: "2026-06-10", rates: { INR: 83.5 } }), { status: 200 });
      }
      if (u.includes("/2024-01-01?base=USD&symbols=INR")) {
        return new Response(JSON.stringify({ date: "2024-01-01", rates: { INR: 82.7 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ rates: {} }), { status: 200 });
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns identity for same-currency", async () => {
    const c = new CurrencyConverter(env as any);
    const r = await c.convert(100, "USD", "USD");
    expect(r.rate).toBe(1);
    expect(r.amount).toBe(100);
  });
  it("converts USD → INR at latest rate", async () => {
    const c = new CurrencyConverter(env as any);
    const r = await c.convert(100, "USD", "INR");
    expect(r.rate).toBe(83.5);
    expect(r.amount).toBeCloseTo(8350, 1);
  });
  it("respects historical date param", async () => {
    const c = new CurrencyConverter(env as any);
    const r = await c.convert(100, "USD", "INR", "2024-01-01");
    expect(r.date).toBe("2024-01-01");
    expect(r.rate).toBe(82.7);
  });
});

describe("MCP protocol", () => {
  const server = new McpServer({ name: "unit-converter-mcp", version: "0.1.0" });
  for (const t of buildTools()) server.register(t);
  const ctx: ToolContext = { env: env as any, apiKey: null, tier: "free", callsRemaining: 500 };

  it("lists 6 tools (none premium)", async () => {
    const r = await server.handle({ jsonrpc: "2.0", id: 1, method: "tools/list" }, ctx);
    const names = (r!.result as any).tools.map((t: any) => t.name) as string[];
    expect(names.length).toBe(6);
    expect(names).toContain("convert_unit");
    expect(names).toContain("convert_currency");
    expect(names).toContain("convert_timezone");
  });

  it("convert_unit end-to-end (100 km → miles)", async () => {
    const r = await server.handle(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "convert_unit", arguments: { value: 100, from: "km", to: "miles" } } }, ctx
    );
    const out = JSON.parse((r!.result as any).content[0].text);
    expect(out.output.value).toBeCloseTo(62.137, 2);
  });
});
