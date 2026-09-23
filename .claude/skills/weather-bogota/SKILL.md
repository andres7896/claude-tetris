---
name: weather-bogota
description: Fetches the current local weather for Bogota, Colombia (temperature, feels-like, condition, humidity, wind) using the free Open-Meteo API, no API key required. Use this whenever the user asks about the weather, temperature, or forecast in Bogota, or asks "que clima hace en Bogota" or similar, even if they don't mention this skill by name.
---

# Weather in Bogota

Get current weather conditions for Bogota, Colombia (lat 4.7110, lon -74.0721) using the free Open-Meteo API (no API key needed).

## How to use

Run the bundled script and report its output to the user:

```bash
node "scripts/get-weather.js"
```

The script calls Open-Meteo's forecast endpoint and prints:
- Local time
- Condition (translated from the WMO weather code, in Spanish)
- Temperature and "feels like" temperature (Celsius)
- Relative humidity (%)
- Wind speed (km/h) and direction (compass label)

Present the result to the user in clear, friendly prose (or a short bulleted summary) rather than pasting the raw script output verbatim, unless they ask for raw data.

## Notes

- Requires only Node.js (uses the built-in global `fetch`) — no `npm install` needed. Verified working with Node v24.
- If the request fails (no internet, API down, timeout), the script prints an error to stderr and exits non-zero; relay that failure to the user rather than guessing at the weather.
- The coordinates are hardcoded to central Bogota. If the user asks about a different city, don't reuse this skill as-is — either adapt the latitude/longitude or note that it's scoped to Bogota.
