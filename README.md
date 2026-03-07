# 🤖 Telegram AI Bot with Mini App

Full-featured Telegram bot with a cyberpunk-styled Mini App providing AI services via Replicate API.

## Features

| Feature | Command | Model |
|---------|---------|-------|
| 🎨 Image Generation | `/generate <prompt>` | FLUX Schnell / Dev / SDXL |
| ✨ Image Enhancement | `/enhance` + photo | Real-ESRGAN 4x |
| 🪄 Background Removal | `/removebg` + photo | RemBG |
| 🎬 Video Generation | `/video <prompt>` | Minimax Video-01 |
| 💬 AI Chat | `/ask <question>` | Llama 3.1 8B |
| 📊 History | `/history` | — |

## Quick Start

```bash
# 1. Install dependencies
npm install
cd miniapp && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your tokens

# 3. Initialize database
npm run db:init

# 4. Start development
npm run dev
```

## Architecture

```
telegram-ai-bot/
├── bot/              # Grammy Telegram bot
│   ├── commands/     # Bot commands
│   ├── middlewares/  # Auth, rate limit, logging
│   └── utils/        # DB, Replicate client, queue
├── server/           # Express API server
│   ├── routes/       # API & webhook routes
│   └── services/     # Replicate & Telegram services
├── miniapp/          # React Mini App (Vite + Tailwind)
│   └── src/
│       ├── pages/    # Home, ImageGen, VideoGen, etc.
│       ├── components/
│       └── hooks/
└── database/         # SQLite schema
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `PORT` | Server port (default: 3000) |
| `MINIAPP_URL` | Public URL for Mini App |
| `DATABASE_PATH` | SQLite database path |

## Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server + miniapp in dev mode |
| `npm run server:dev` | Start only the server (with bot) |
| `npm run miniapp:dev` | Start only the Mini App |
| `npm run db:init` | Initialize SQLite database |
| `npm run test:models` | Test Replicate API models |

## Production Deployment

1. Set up a public URL (ngrok, Cloudflare Tunnel, or hosting)
2. Update `TELEGRAM_WEBHOOK_URL` and `MINIAPP_URL` in `.env`
3. Build: `npm run build`
4. Start: `npm start`
