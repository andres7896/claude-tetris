#!/usr/bin/env node
// Fetch and print current weather for Bogota, Colombia via Open-Meteo (no API key needed).

const LAT = 4.7110;
const LON = -74.0721;
const URL_ = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
  `weather_code,wind_speed_10m,wind_direction_10m,is_day` +
  `&timezone=America%2FBogota`;

// WMO weather interpretation codes -> human-readable description (Spanish)
const WEATHER_CODES = {
  0: "Cielo despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta electrica",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso",
};

function windDirectionLabel(degrees) {
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

async function main() {
  let data;
  try {
    const response = await fetch(URL_, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    data = await response.json();
  } catch (err) {
    console.error(`Error al consultar el clima: ${err.message}`);
    process.exit(1);
  }

  const current = data.current;
  if (!current) {
    console.error("La API no devolvio datos de clima actual.");
    process.exit(1);
  }

  const {
    temperature_2m: temp,
    apparent_temperature: feelsLike,
    relative_humidity_2m: humidity,
    wind_speed_10m: windSpeed,
    wind_direction_10m: windDir,
    weather_code: code,
    time,
  } = current;

  const condition = WEATHER_CODES[code] ?? `Codigo desconocido (${code})`;
  const windLabel = windDir !== undefined ? windDirectionLabel(windDir) : "?";

  console.log("Clima actual en Bogota, Colombia");
  console.log(`Hora local: ${time}`);
  console.log(`Condicion: ${condition}`);
  console.log(`Temperatura: ${temp} C (sensacion termica: ${feelsLike} C)`);
  console.log(`Humedad: ${humidity}%`);
  console.log(`Viento: ${windSpeed} km/h (${windLabel})`);
}

main();
