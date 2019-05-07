# Random REST API

It was just a random idea at first before it actually became something. It's
integrated with Twitch. You can log in to Twitch, accept the app, and see your 
isplay name and profile image in the corner.

## Install

```bash
git clone git@github.com:AlcaDesign/random-rest-api.git
cd random-rest-api
npm install
# Set up a .env file or whatever
node server.js
```

Required environment details:
```
HTTP_PORT=7500

MONGO_DB=random-rest-api
MONGO_USER=random-rest-api
MONGO_PASS=<secrets>

TWITCH_CLIENT_ID=<kinda-secrets>
TWITCH_CLIENT_SECRET=<secrets>
TWITCH_REDIRECT_URI=<url>
TWITCH_SCOPES=scope:a scope:b scope:c

JWT_SECRET=<secrets>
```

Then open http://localhost:7500.