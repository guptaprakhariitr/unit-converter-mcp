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


---

## Sister MCPs

All from the same operator, all live on `<product>.prakhar-cognizance.workers.dev`, all free-tier friendly:

| Group | Products |
|---|---|
| **Research** | [sec-edgar](https://github.com/guptaprakhariitr/sec-edgar-mcp) · [arxiv](https://github.com/guptaprakhariitr/arxiv-mcp) · [world-bank-economic](https://github.com/guptaprakhariitr/world-bank-economic-mcp) · [uspto-patents](https://github.com/guptaprakhariitr/uspto-patents-mcp) · [fda-approvals](https://github.com/guptaprakhariitr/fda-approvals-mcp) |
| **Verification + Utility** | [verification](https://github.com/guptaprakhariitr/verification-mcp) ⭐ · [unit-converter](https://github.com/guptaprakhariitr/unit-converter-mcp) |
| **India** | [indic-normalize](https://github.com/guptaprakhariitr/indic-normalize-mcp) · [indian-regulatory](https://github.com/guptaprakhariitr/indian-regulatory-mcp) |
| **Real-time** | [hn-trending](https://github.com/guptaprakhariitr/hn-trending-mcp) · [wikipedia-recent-changes](https://github.com/guptaprakhariitr/wikipedia-recent-changes-mcp) · [gdelt-events](https://github.com/guptaprakhariitr/gdelt-events-mcp) · [crypto-prices](https://github.com/guptaprakhariitr/crypto-prices-mcp) |
| **Healthcare** | [drug-interaction](https://github.com/guptaprakhariitr/drug-interaction-mcp) |
| **Logistics** | [multi-carrier-tracking](https://github.com/guptaprakhariitr/multi-carrier-tracking-mcp) |

Full catalog: https://github.com/guptaprakhariitr · ⭐ = empty-quadrant / highest-conviction pick.

