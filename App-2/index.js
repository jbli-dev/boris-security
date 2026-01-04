const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3031;

// Configurations
const CLIENT_ID = 'app-2';
const CLIENT_SECRET = 'secret-2';
const IDP_URL = 'http://localhost:3000';
const SERVICE_URL = 'http://localhost:3010';
const REDIRECT_URI = 'http://localhost:3031/callback';

// Mock session store
const sessions = {};
const generateSessionId = () => Math.random().toString(36).substring(7);

app.use(express.urlencoded({ extended: true }));
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

// 1. Landing Page
app.get('/', (req, res) => {
    if (req.session && req.session.access_token) {
        res.send(`
            <html>
                <body style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; text-align: center;">
                    <h1>App-2: Load Test Client</h1>
                    <p>Logged in as <b>${CLIENT_ID}</b></p>
                    <div style="margin-top: 30px;">
                        <form action="/test" method="POST">
                            <button type="submit" style="padding: 15px 30px; font-size: 1.2rem; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Run Load Test (100 Request)
                            </button>
                        </form>
                    </div>
                    <div style="margin-top: 20px;">
                        <a href="/logout">Logout</a>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; text-align: center;">
                    <h1>App-2: Load Test Client</h1>
                    <p>Login to start testing.</p>
                    <a href="/login"><button style="padding: 10px 20px; cursor: pointer;">Login with IdP</button></a>
                </body>
            </html>
        `);
    }
});

// 2. Load Test Endpoint
app.post('/test', async (req, res) => {
    if (!req.session || !req.session.access_token) {
        return res.redirect('/');
    }

    const token = req.session.access_token;

    // Set headers for chunked transfer
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Write initial HTML
    res.write(`
        <html>
            <body style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
                <h1>Running Load Test...</h1>
                <p>Initiating 100 parallel requests...</p>
                <div id="results" style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 20px;">
                    <ul style="list-style-type: none; padding: 0;">
    `);

    const requests = [];
    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    // Create 100 parallel requests
    for (let i = 1; i <= 300; i++) {
        const p = axios.get(`${SERVICE_URL}/weather`, {
            params: { city: 'Brooklyn, New York' },
            headers: { 'Authorization': `Bearer ${token}` } // Sending token
        })
            .then((response) => {
                successCount++;
                res.write(`<li style="color: green;">Request #${i}: Success (200 OK) - ${JSON.stringify(response.data)}</li>`);
            })
            .catch(err => {
                errorCount++;
                res.write(`<li style="color: red;">Request #${i}: Failed (${err.message})</li>`);
            });

        requests.push(p);
    }

    try {
        await Promise.all(requests);
        const duration = Date.now() - startTime;

        // Write summary
        res.write(`
                    </ul>
                </div>
                <h2>Test Complete</h2>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
                    <p><b>Total Requests:</b> 100</p>
                    <p><b>Duration:</b> ${duration} ms</p>
                    <p style="color: green;"><b>Success:</b> ${successCount}</p>
                    <p style="color: red;"><b>Errors:</b> ${errorCount}</p>
                </div>
                <div style="margin-top: 20px;">
                    <a href="/">Back to Home</a>
                </div>
                <script>
                    // Scroll to bottom of results
                    const resultsParams = document.getElementById('results');
                    resultsParams.scrollTop = resultsParams.scrollHeight;
                </script>
            </body>
        </html>
    `);

        res.end();

    } catch (error) {
        // Should not happen as individual promises catch errors, but good safety
        console.error('Critical Error:', error);
        res.write(`<p style="color: red; font-weight: bold;">Critical Error: ${error.message}</p></body></html>`);
        res.end();
    }
});

// 3. OAuth Login
app.get('/login', (req, res) => {
    const authUrl = `${IDP_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&state=load_test`;
    res.redirect(authUrl);
});

// 4. OAuth Callback
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code returned');

    try {
        const response = await axios.post(`${IDP_URL}/token`, {
            grant_type: 'authorization_code',
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI
        });

        const sessionId = generateSessionId();
        sessions[sessionId] = { access_token: response.data.access_token };

        res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; Path=/`);
        res.redirect('/');

    } catch (error) {
        res.status(500).send('Authentication failed: ' + error.message);
    }
});

app.get('/logout', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) delete sessions[sessionId];
    res.setHeader('Set-Cookie', 'session_id=; HttpOnly; Path=/; Max-Age=0');
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`App-2 running on http://localhost:${PORT}`);
});
