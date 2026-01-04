# Minimal NodeJS Weather Service

A minimal RESTful service to fetch current weather data using the Open-Meteo API.

## Features

- Get current weather by **City Name** (e.g., "Brooklyn, New York")
- Get current weather by **Geographic Coordinates** (Latitude & Longitude)
- Supports searching by **Postal Code** (e.g., "11204")

## Installation

1. Navigate to the Service directory:
   ```bash
   cd Service
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   The service will run on `http://localhost:3000`.

## API Usage

### GET /weather

Fetch current weather information.

#### Parameters

| Parameter   | Type   | Description                                                                 |
| :---------- | :----- | :-------------------------------------------------------------------------- |
| `city`      | String | Name of the city (e.g., "Brooklyn, New York") or Postal Code (e.g. "11204") |
| `latitude`  | Number | Latitude of the location (required if `city` is not provided)               |
| `longitude` | Number | Longitude of the location (required if `city` is not provided)              |

> **Note:** If `city` is provided, it takes precedence. The service uses the first part of a comma-separated string to search.

#### Examples

**1. Get Weather by City (Brooklyn, New York)**

```bash
curl "http://localhost:3000/weather?city=Brooklyn,New%20York"
```

**2. Get Weather by Postal Code (11204 - Brooklyn)**

```bash
curl "http://localhost:3000/weather?city=11204"
```

**3. Get Weather by Coordinates (New York City)**

```bash
curl "http://localhost:3000/weather?latitude=40.71&longitude=-74.01"
```

#### Response Example

```json
{
  "time": "2026-01-04T18:00",
  "interval": 900,
  "temperature": 1.2,
  "windspeed": 8.2,
  "winddirection": 311,
  "is_day": 1,
  "weathercode": 2
}
```
