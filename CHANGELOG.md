# Changelog

## [0.1.0] — 2026-06-10

### Added
- Six tools: `convert_unit`, `list_units`, `convert_currency`, `convert_timezone`, `date_diff`, `list_timezones`.
- 10 unit categories with 60+ unit definitions: length, mass, volume, area, time, temperature (with offset handling for °C/°F), energy, speed, data (decimal + binary), pressure.
- Currency conversion via exchangerate.host (free, no key required). 6-hour KV cache per (base, quote, date).
- Common timezones (UTC, America/*, Europe/*, Asia/Kolkata, Tokyo, Singapore, etc.) with UTC-offset arithmetic. **Caveat:** does not handle DST — production users should pass UTC ISO and use the offset table to normalize, or wait for v0.2 when full IANA tz data is bundled.
- Generous free tier (500 calls/month vs 100 for other Cat-1 products) — this is a loss-leader / utility play.
- Cheapest paid tier on the platform: $5/mo (vs $9 for other Cat-1 products).
