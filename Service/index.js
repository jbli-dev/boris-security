const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3010;
const JWT_SECRET = 'b9f3d5a8e2c6f1a7d4b9c0e2f5a8d3c1b7e6f4a9c8d2e0f7a1b5c6d9e3f0a2b4c-1'; // Must match IdP

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

app.get('/weather', authenticateToken, async (req, res) => {
    try {
        let { latitude, longitude, city } = req.query;

        if (city) {
            // sanitize city: use the part before comma if present
            const cityName = city.split(',')[0].trim();
            // Geocode the city
            try {
                const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
                    params: {
                        name: cityName,
                        count: 1,
                        language: 'en',
                        format: 'json'
                    }
                });

                if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
                    return res.status(404).json({ error: 'City not found' });
                }

                const location = geoResponse.data.results[0];
                latitude = location.latitude;
                longitude = location.longitude;
            } catch (geoError) {
                console.error('Error geocoding city:', geoError.message);
                return res.status(500).json({ error: 'Failed to geocode city' });
            }
        }

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude OR city are required' });
        }

        // Fetch weather data from Open-Meteo
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude,
                longitude,
                current_weather: true
            }
        });

        res.json(response.data.current_weather);
    } catch (error) {
        if (error.response) {
            console.error('Error fetching weather data:', error.response.status, error.response.data);
        } else {
            console.error('Error fetching weather data:', error.message);
        }
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.listen(PORT, () => {
    console.log(`Weather service running on http://localhost:${PORT}`);
});
