# GitHub Upload Guide

## Quick Steps:

1. **GitHub.com par jao** → https://github.com/rana-saboorr/red-web-backend

2. **"Add file" → "Upload files" click karein**

3. **Ye files upload karein:**
   - package.json
   - index.js
   - config/firebase.js
   - routes/search.js
   - routes/bloodBanks.js
   - routes/bloodInventory.js
   - routes/bloodRequests.js
   - routes/campaigns.js
   - middleware/auth.js
   - .gitignore

4. **"Commit changes" click karein**

5. **Render.com par "Manual Deploy" karein**

## Files Content:

### package.json
```json
{
  "name": "red-web-backend",
  "version": "1.0.0",
  "description": "RedRelief Blood Donation API Server",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.6.0",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.1",
    "firebase": "^11.9.1",
    "helmet": "^7.2.0"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "keywords": [
    "blood-donation",
    "api",
    "express",
    "firebase"
  ],
  "author": "RedRelief Team",
  "license": "MIT"
}
```

### index.js
[Copy from red-web-backend/index.js]

### config/firebase.js
[Copy from red-web-backend/config/firebase.js]

### routes/search.js
[Copy from red-web-backend/routes/search.js]

### routes/bloodBanks.js
[Copy from red-web-backend/routes/bloodBanks.js]

### routes/bloodInventory.js
[Copy from red-web-backend/routes/bloodInventory.js]

### routes/bloodRequests.js
[Copy from red-web-backend/routes/bloodRequests.js]

### routes/campaigns.js
[Copy from red-web-backend/routes/campaigns.js]

### middleware/auth.js
[Copy from red-web-backend/middleware/auth.js]

### .gitignore
[Copy from red-web-backend/.gitignore] 