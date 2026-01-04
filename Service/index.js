const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3010;

// Client JWT secrets (must match IdP configuration)
const CLIENT_SECRETS = {
    'app-1': 'jwt-secret-app-1-change-in-production',
    'app-2': 'jwt-secret-app-2-change-in-production'
};

// Middleware to verify JWT with client-specific secret
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // Unauthorized

    // First, decode without verification to get the client_id (aud)
    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch (err) {
        return res.sendStatus(403); // Forbidden
    }

    if (!decoded || !decoded.aud) {
        return res.sendStatus(403); // No audience claim
    }

    const clientId = decoded.aud;
    const jwtSecret = CLIENT_SECRETS[clientId];

    if (!jwtSecret) {
        return res.sendStatus(403); // Unknown client
    }

    // Now verify with the client-specific secret
    jwt.verify(token, jwtSecret, (err, user) => {
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
