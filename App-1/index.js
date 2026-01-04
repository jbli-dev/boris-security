const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3030;

// Configurations
const CLIENT_ID = 'app-1';
const CLIENT_SECRET = 'secret-1'; // In a real app, this should be an env var
const IDP_URL = 'http://localhost:3000';
const SERVICE_URL = 'http://localhost:3010';
const REDIRECT_URI = 'http://localhost:3030/callback';

// Mock session store
const sessions = {};

// Helper to generate simple session ID
const generateSessionId = () => Math.random().toString(36).substring(7);

app.use(express.urlencoded({ extended: true }));

// Middleware to parse cookies (simplified)
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            req.cookies[parts[0].trim()] = parts[1].trim();
        });
    }
    req.session = sessions[req.cookies.session_id];
    next();
});

// 1. Homepage
app.get('/', async (req, res) => {
    let weatherHtml = '';
    let cityInput = '';

    if (req.session && req.session.access_token) {
        // Fetch Weather Data
        const city = req.query.city || 'Brooklyn, New York';

        try {
            const response = await axios.get(`${SERVICE_URL}/weather`, {
                params: { city },
                headers: {
                    'Authorization': `Bearer ${req.session.access_token}` // Sending token (Service currently ignores it)
                }
            });

            const weather = response.data;
            weatherHtml = `
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2>Weather in ${city}</h2>
                    <p>Temperature: ${weather.temperature}°C</p>
                    <p>Wind Speed: ${weather.windspeed} km/h</p>
                    <p>Condition Code: ${weather.weathercode}</p>
                </div>
            `;
            cityInput = `
                <form action="/" method="GET" style="margin-top: 20px;">
                    <input type="text" name="city" placeholder="Enter city (e.g. London)" value="${city}">
                    <button type="submit">Get Weather</button>
                    <a href="/logout" style="margin-left: 10px;">Logout</a>
                </form>
            `;

        } catch (error) {
            weatherHtml = `<p style="color: red;">Error fetching weather: ${error.message}</p>`;
            if (error.response && error.response.status === 401) {
                // Token invalid/expired
                weatherHtml += '<p> <a href="/logout">Logout and try again</a></p>';
            }
        }
    } else {
        weatherHtml = `
            <div style="margin-top: 20px;">
                <p>You are not logged in.</p>
                <a href="/login"><button style="padding: 10px 20px; cursor: pointer;">Login with IdP</button></a>
            </div>
        `;
    }

    res.send(`
        <html>
            <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto;">
                <h1>App-1: Weather Client</h1>
                ${cityInput}
                ${weatherHtml}
            </body>
        </html>
    `);
});

// 2. Login Redirect
app.get('/login', (req, res) => {
    const authUrl = `${IDP_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&state=random_state_string`;
    res.redirect(authUrl);
});

// 3. OAuth Callback
app.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('No code returned from IdP');
    }

    try {
        // Exchange code for token
        const response = await axios.post(`${IDP_URL}/token`, {
            grant_type: 'authorization_code',
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI
        });

        const { access_token } = response.data;

        // Create session
        const sessionId = generateSessionId();
        sessions[sessionId] = { access_token };

        // Set cookie and redirect home
        res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; Path=/`);
        res.redirect('/');

    } catch (error) {
        console.error('Token exchange failed:', error.message);
        if (error.response) {
            console.error(error.response.data);
        }
        res.status(500).send('Authentication failed');
    }
});

app.get('/logout', (req, res) => {
    // Invalidate session
    const sessionId = req.cookies.session_id;
    if (sessionId) delete sessions[sessionId];

    res.setHeader('Set-Cookie', 'session_id=; HttpOnly; Path=/; Max-Age=0');
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`App-1 running on http://localhost:${PORT}`);
});
