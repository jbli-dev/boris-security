const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const { users, clients } = require('./users');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'b9f3d5a8e2c6f1a7d4b9c0e2f5a8d3c1b7e6f4a9c8d2e0f7a1b5c6d9e3f0a2b4c';

// In-memory store for auth codes
const authCodes = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mock session middleware (simplified)
const sessions = {};
app.use((req, res, next) => {
    // Check for a simple session cookie/header (simulated)
    const sessionId = req.headers['x-session-id'] || req.query.session_id; // For simplicity in manual testing
    if (sessionId && sessions[sessionId]) {
        req.user = sessions[sessionId];
    }
    next();
});

// Routes

// 1. Authorization Endpoint
app.get('/authorize', (req, res) => {
    const { client_id, redirect_uri, state, response_type } = req.query;

    const client = clients.find(c => c.clientId === client_id);
    if (!client) return res.status(400).send('Invalid Client ID');
    if (!client.redirectUris.includes(redirect_uri)) return res.status(400).send('Invalid Redirect URI');

    // If user is already authenticated (simulated session check)
    // For this simple demo, we'll force login if no user in session, or if we want to prompt interaction
    // Here we'll just check if req.user is set (from our session middleware)
    if (req.user) {
        const code = Math.random().toString(36).substring(7);
        authCodes[code] = {
            client_id,
            redirect_uri,
            user: req.user,
            expiresAt: Date.now() + 60000 // 1 minute expiry
        };
        return res.redirect(`${redirect_uri}?code=${code}&state=${state || ''}`);
    }

    // Render login page
    res.render('login', { client_id, redirect_uri, state, error: null });
});

// 2. Login Endpoint
app.post('/login', (req, res) => {
    const { username, password, client_id, redirect_uri, state } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.render('login', { client_id, redirect_uri, state, error: 'Invalid credentials' });
    }

    // Create session (mock)
    const sessionId = Math.random().toString(36).substring(7);
    sessions[sessionId] = { id: user.id, username: user.username, name: user.name };

    // In a real app, we'd set a cookie here. 
    // For this flow, we proceed to generate the auth code immediately as if we were redirected back to /authorize

    const code = Math.random().toString(36).substring(7);
    authCodes[code] = {
        client_id,
        redirect_uri,
        user: sessions[sessionId], // Attach user info to code
        expiresAt: Date.now() + 60000
    };

    // Redirect back to client
    const redirectUrl = `${redirect_uri}?code=${code}&state=${state || ''}`;
    res.redirect(redirectUrl);
});

// 3. Token Endpoint
app.post('/token', (req, res) => {
    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

    if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    const authCodeData = authCodes[code];
    if (!authCodeData) {
        return res.status(400).json({ error: 'invalid_grant' });
    }

    if (Date.now() > authCodeData.expiresAt) {
        delete authCodes[code];
        return res.status(400).json({ error: 'invalid_grant (expired)' });
    }

    if (authCodeData.client_id !== client_id) {
        return res.status(400).json({ error: 'invalid_client' });
    }

    // Validate client secret (if provided - public clients might not have one, but we defined one in users.js)
    const client = clients.find(c => c.clientId === client_id);
    if (client_secret && client.clientSecret !== client_secret) {
        return res.status(401).json({ error: 'invalid_client' });
    }

    // Generate JWT
    const token = jwt.sign(
        {
            sub: authCodeData.user.id,
            username: authCodeData.user.username,
            name: authCodeData.user.name,
            aud: client_id,
            aud: client_id,
            iss: 'http://localhost:3000'
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // cleanup code
    delete authCodes[code];

    res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600
    });
});

app.listen(PORT, () => {
    console.log(`IdP running on http://localhost:${PORT}`);
});
