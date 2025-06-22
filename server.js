import express from "express";
import fetch from "node-fetch";
import ColorThief from "colorthief";
import { Buffer } from "node:buffer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

let accessToken = null;
let tokenExpires = 0;

async function refreshAccessToken() {
    if (Date.now() < tokenExpires) return accessToken;
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization:
                "Basic " +
                Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
                ).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
        }),
    });
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpires = Date.now() + data.expires_in * 1000 - 60000; // 1-min buffer
    return accessToken;
}

async function getNowPlaying() {
    const token = await refreshAccessToken();
    const res = await fetch(
        "https://api.spotify.com/v1/me/player/currently-playing",
        { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 204) return null;          // nothing playing
    const info = await res.json();
    const track = info.item;

    const imgURL = track.album.images[0].url;

    // --- fetch image -> buffer so Sharp can read it ---
    let r = 0, g = 0, b = 0;
    try {
        const imgRes = await fetch(imgURL);
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        [r, g, b] = await ColorThief.getColor(buffer);
    } catch (err) {
        console.warn("Color extraction failed, falling back to black.", err);
    }

    // tempo (BPM) for visuals
    const featRes = await fetch(
        `https://api.spotify.com/v1/audio-features/${track.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const feat = await featRes.json();

    return {
        title: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        track_id: track.id,
        img: imgURL,
        progress_ms: info.progress_ms,
        duration_ms: track.duration_ms,
        color: { r, g, b },
        bpm: feat.tempo ?? 120
    };
}

app.get("/api/now", async (_, res) => {
    try {
        const data = await getNowPlaying();
        res.json(data || {});
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🎶  Listening on ${port}`));