module.exports = {
    users: [
        {
            id: '1',
            username: 'user1',
            password: 'password', // In real app, this should be hashed
            name: 'John Doe'
        },
        {
            id: '2',
            username: 'user2',
            password: 'password', // In real app, this should be hashed
            name: 'Jane Doe'
        },
        {
            id: '3',
            username: 'user3',
            password: 'password', // In real app, this should be hashed
            name: 'Maria'
        },
        {
            id: '2',
            username: 'admin',
            password: 'password',
            name: 'Admin User'
        }
    ],
    clients: [
        {
            clientId: 'app-1',
            clientSecret: 'secret-1',
            jwtSecret: 'jwt-secret-app-1-change-in-production',
            redirectUris: ['http://localhost:3030/callback']
        },
        {
            clientId: 'app-2',
            clientSecret: 'secret-2',
            jwtSecret: 'jwt-secret-app-2-change-in-production',
            redirectUris: ['http://localhost:3031/callback']
        }
    ]
};
