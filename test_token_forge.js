// Test: Can a developer forge a JWT token and call the API?
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Scenario 1: Developer has access to jwtSecret (e.g., from clients.json)
const JWT_SECRET = 'jwt-secret-app-1-change-in-production';

// Forge a token for user1
const forgedToken = jwt.sign(
    {
        sub: '1',
        username: 'user1',
        name: 'John Doe',
        aud: 'app-1',
        iss: 'http://localhost:3000'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log('=== Token Forgery Test ===\n');
console.log('Forged JWT Token:', forgedToken);
console.log('\n--- Attempting to call Service API with forged token ---\n');

// Try to call the Service API with the forged token
async function testForgedToken() {
    try {
        // Test 1: Get weather data
        const weatherResponse = await axios.get('http://localhost:3010/weather', {
            params: { city: 'London' },
            headers: {
                'Authorization': `Bearer ${forgedToken}`
            }
        });
        console.log('✅ Weather API call SUCCEEDED with forged token!');
        console.log('Response:', weatherResponse.data);

        // Test 2: Get user data
        const userDataResponse = await axios.get('http://localhost:3010/user-data', {
            headers: {
                'Authorization': `Bearer ${forgedToken}`
            }
        });
        console.log('\n✅ User Data API call SUCCEEDED with forged token!');
        console.log('Response:', userDataResponse.data);

        console.log('\n⚠️  SECURITY ISSUE: Developer can forge tokens if they have access to jwtSecret!');

    } catch (error) {
        console.log('❌ API call FAILED:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

// Test with wrong secret
async function testWrongSecret() {
    console.log('\n\n=== Testing with WRONG jwtSecret ===\n');

    const wrongToken = jwt.sign(
        {
            sub: '1',
            username: 'user1',
            name: 'John Doe',
            aud: 'app-1',
            iss: 'http://localhost:3000'
        },
        'WRONG-SECRET',
        { expiresIn: '1h' }
    );

    console.log('Token signed with wrong secret:', wrongToken);
    console.log('\n--- Attempting to call Service API ---\n');

    try {
        const response = await axios.get('http://localhost:3010/weather', {
            params: { city: 'London' },
            headers: {
                'Authorization': `Bearer ${wrongToken}`
            }
        });
        console.log('✅ API call succeeded (unexpected!)');
    } catch (error) {
        console.log('❌ API call FAILED (expected!)');
        console.log('Status:', error.response?.status, '- Token verification failed');
        console.log('\n✅ GOOD: Service correctly rejected token with wrong signature');
    }
}

// Run tests
testForgedToken().then(() => testWrongSecret());
