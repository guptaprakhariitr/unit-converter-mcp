# unit-converter-mcp

> The boring utility every AI agent needs. Convert units (length, mass, volume, area, time, temperature, energy, speed, data, pressure), currencies (live FX), timezones, and dates.

**Endpoint:** `https://unit-converter-mcp.prakhar-cognizance.workers.dev/mcp`

Loss-leader for the product family — cheapest tier on the platform, **generous free tier (500/mo)**, designed for broad install + cross-sell.

## Tools

| Tool | Examples |
|---|---|
| `convert_unit(value, from, to)` | 100 km → miles · 32°F → C · 1 GB → MiB · 2.5 cups → tbsp |
| `list_units()` | Returns the full unit dictionary grouped by category |
| `convert_currency(amount, from, to, date?)` | 100 USD → INR (latest or historical) |
| `convert_timezone(iso, from_tz, to_tz)` | "2026-06-09T14:00" IST → America/New_York |
| `date_diff(from, to, unit?)` | Days between two dates |
| `list_timezones()` | Supported tz + UTC offset |

## Install

```json
{
  "mcpServers": {
    "units": {
      "url": "https://unit-converter-mcp.prakhar-cognizance.workers.dev/mcp"
    }
  }
}
```

Free tier: no key needed, 500 calls/month.

## Pricing

| Tier | Price | Monthly calls |
|---|---|---|
| Free | $0 | 500 |
| **Solo** | **$5/mo** | 5,000 |
| **Team** | **$15/mo** | 50,000 |
| **Pro** | **$39/mo** | 250,000 |

[Upgrade →](https://unit-converter-mcp.prakhar-cognizance.workers.dev/upgrade?tier=solo)

## License

MIT. FX data from [exchangerate.host](https://exchangerate.host).
