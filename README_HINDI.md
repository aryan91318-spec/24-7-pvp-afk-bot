# REDNOVA AI — Render Web Service Compatible

Server default:
PUPOMC.aternos.me:53902
Bot: REDNOVA_AI

इस version में HTTP health server जोड़ा गया है। यह Render को `PORT` पर open HTTP port देता है, जबकि Minecraft bot अलग process में चलता है।

Render:
- Service type: Web Service
- Build Command: npm install
- Start Command: npm start
- Environment variables render.yaml में configured हैं।

Bot recovery:
- Minecraft disconnect -> reconnect
- Bot process crash -> supervisor restart

ध्यान:
Render Free Web Service sleep/usage limits के अधीन हो सकता है। HTTP health endpoint जोड़ने से Render की free-plan sleep policy खत्म नहीं होती।
Aternos server online होना जरूरी है।
