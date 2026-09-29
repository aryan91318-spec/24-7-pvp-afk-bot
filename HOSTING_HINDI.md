# REDNOVA AI — 24/7 Hosting Setup

यह version दो स्तर पर recovery करता है:

1. `bot.js` — Minecraft connection टूटने पर reconnect करता है।
2. `supervisor.js` — Node bot process crash हो जाए तो नया process शुरू करता है।

## Start
```bash
npm install
npm start
```

## Hosting पर जरूरी settings
- Node.js 18+ रखें।
- Start command: `npm start`
- Environment variables में `.env.example` वाली values सेट करें।
- Hosting में restart-on-failure / always-on option उपलब्ध हो तो उसे ON करें।

## 24/7 की वास्तविक शर्त
Hosting provider को process को लगातार चलाने देना होगा। Free hosting में sleep/idle limits हो सकती हैं; bot code उन limits को bypass नहीं करता।

## सुरक्षित command control
`OWNER_NAME` में अपना Minecraft username डालने पर chat commands केवल उसी player से स्वीकार होंगे।

## Commands
!help
!come
!follow
!stop
!wood
!mine
!status
!inv
!goto x y z
