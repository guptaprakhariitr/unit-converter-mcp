import { Tool } from "./mcp-server";
import { convertUnit, listUnits, CurrencyConverter, ConverterEnv, convertTimezone, dateDiff, COMMON_TZ_OFFSETS } from "./converter";

export function buildTools(): Tool[] {
  return [
    {
      name: "convert_unit",
      description:
        "Convert a numeric value between units. Categories: length, mass, volume, area, time, temperature, energy, speed, data, pressure. Accepts canonical names ('meter', 'pound') or common aliases ('m', 'lb'). Returns {input, output, category}.",
      inputSchema: {
        type: "object",
        properties: {
          value: { type: "number", description: "Numeric value to convert." },
          from: { type: "string", description: "Source unit, e.g. 'meter' or 'm'." },
          to: { type: "string", description: "Target unit." },
        },
        required: ["value", "from", "to"],
      },
      handler: async (args) => convertUnit(args.value, args.from, args.to),
    },

    {
      name: "list_units",
      description: "List all supported units grouped by category. Use this when you're not sure what unit names the converter accepts.",
      inputSchema: { type: "object", properties: {}, required: [] },
      handler: async () => listUnits(),
    },

    {
      name: "convert_currency",
      description:
        "Convert an amount between currencies. Live FX from exchangerate.host (free, no key). Pass an optional ISO date for historical rates. Returns {amount, from, to, rate, date, source}.",
      inputSchema: {
        type: "object",
        properties: {
          amount: { type: "number" },
          from: { type: "string", description: "ISO 4217 code, e.g. 'USD'." },
          to: { type: "string", description: "ISO 4217 code, e.g. 'INR'." },
          date: { type: "string", description: "Optional ISO date YYYY-MM-DD for historical rate." },
        },
        required: ["amount", "from", "to"],
      },
      handler: async (args, ctx) => {
        const c = new CurrencyConverter(ctx.env as unknown as ConverterEnv);
        return await c.convert(args.amount, args.from, args.to, args.date);
      },
    },

    {
      name: "convert_timezone",
      description:
        "Re-anchor an ISO datetime from one IANA timezone to another. Accepts the common timezones (UTC, America/*, Europe/*, Asia/Kolkata, Asia/Tokyo, etc.). Returns the equivalent ISO datetime in the target timezone + the offset difference in hours.",
      inputSchema: {
        type: "object",
        properties: {
          iso: { type: "string", description: "Input datetime, ISO 8601." },
          from_tz: { type: "string", description: "Source IANA timezone." },
          to_tz: { type: "string", description: "Target IANA timezone." },
        },
        required: ["iso", "from_tz", "to_tz"],
      },
      handler: async (args) => convertTimezone(args.iso, args.from_tz, args.to_tz),
    },

    {
      name: "date_diff",
      description: "Calculate the difference between two ISO dates in the requested unit (ms / seconds / minutes / hours / days / weeks).",
      inputSchema: {
        type: "object",
        properties: {
          from: { type: "string", description: "Earlier ISO date/datetime." },
          to: { type: "string", description: "Later ISO date/datetime." },
          unit: { type: "string", enum: ["ms", "seconds", "minutes", "hours", "days", "weeks"], default: "days" },
        },
        required: ["from", "to"],
      },
      handler: async (args) => dateDiff(args.from, args.to, args.unit ?? "days"),
    },

    {
      name: "list_timezones",
      description: "List supported timezones + UTC offsets.",
      inputSchema: { type: "object", properties: {}, required: [] },
      handler: async () => Object.entries(COMMON_TZ_OFFSETS).map(([tz, offset]) => ({ tz, utc_offset_hours: offset })),
    },
  ];
}
