# Spotify Kiosk Visualizer

A small kiosk application that displays the currently playing Spotify track.

[![Demo video](https://img.youtube.com/vi/-zne0ebVi9k/hqdefault.jpg)](https://www.youtube.com/shorts/-zne0ebVi9k)

---

## Tech Stack

* Node 18, Express, node-fetch, ColorThief (Sharp), PM2  
* Front end: Vanilla JS, Three.js 0.160, HTML5 Canvas, CSS  
* Spotify Web API (OAuth Authorization Code + Refresh Token)

---

## Quick Start

### 1. Clone and install
```bash
git clone https://github.com/your-handle/spotify-kiosk.git
cd spotify-kiosk
npm install
```

### 2. Create a Spotify application
* Add `http://localhost:8888/callback` to Redirect URIs  
* Note the Client ID and Client Secret

### 3. Obtain a refresh token
```bash
# Authorize
https://accounts.spotify.com/authorize?client_id=YOUR_ID&response_type=code&redirect_uri=http://localhost:8888/callback&scope=user-read-playback-state%20user-read-currently-playing&state=xyz

# Exchange code for tokens
curl -s -X POST https://accounts.spotify.com/api/token \
  -H "Authorization: Basic $(printf "%s:%s" YOUR_ID YOUR_SECRET | base64)" \
  -d grant_type=authorization_code \
  -d code=PASTE_CODE_HERE \
  -d redirect_uri=http://localhost:8888/callback | jq
```

### 4. Configure
Create `.env`:
```env
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
PORT=3000
```

### 5. Run
```bash
npm start          # http://localhost:3000
```

### 6. Autostart (optional)
```bash
sudo npm i -g pm2
pm2 start server.js --name spotify-kiosk
pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

---

## Folder Structure
```
spotify-kiosk
├── server.js
├── package.json
├── .env.example
└── public/
    ├── index.html
    ├── style.css
    └── main.js
```