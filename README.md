# Security Demo Solution

This repository contains a set of projects demonstrating a minimal security architecture with an Identity Provider (IdP), a Resource Server (Service), and Client Applications.

## Projects

| Project | Type | Port | Description |
| :--- | :--- | :--- | :--- |
| **IdP** | NodeJS/Express | `3000` | Identity Provider (OAuth2/OIDC) |
| **Service** | NodeJS/Express | `3010` | Weather API (Resource Server) |
| **App-1** | NodeJS/Express | `3030` | Client Application (Regular) |
| **App-2** | NodeJS/Express | `3031` | Client Application (Load Testing) |

## Startup Sequence

You will need to run each project in a separate terminal window.

### 1. Start the Service (Weather API)
```bash
cd Service
npm start
```
*   **Verify**: `curl "http://localhost:3010/weather?city=Brooklyn,New%20York"`

### 2. Start the Identity Provider (IdP)
```bash
cd IdP
npm start
```
*   **Verify**: Visit `http://localhost:3000/authorize?client_id=app-1&redirect_uri=http://localhost:3030/callback&response_type=code` in your browser.

### 3. Start App-1 (Client)
```bash
cd App-1
npm start
```

### 4. Start App-2 (Load Test Client)
```bash
cd App-2
npm start
```

## Testing the Full Flow

### App-1 (Standard Client)
1.  Open `http://localhost:3030`.
2.  Login with IdP.
3.  View Weather Data.

### App-2 (Load Test)
1.  Open `http://localhost:3031`.
2.  Login with IdP.
3.  Click **Run Load Test (100 Request)**.
4.  Wait for the results page showing Success/Error counts and total duration.
# boris-security
