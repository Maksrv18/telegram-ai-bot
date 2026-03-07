import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api";
import webhookRoutes, { setBotInstance } from "./routes/webhook";
import { createBot, startBot } from "../bot/index";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api", apiRoutes);

// Webhook route (for production)
app.use("/webhook", webhookRoutes);

// Serve Mini App static files in production
if (process.env.NODE_ENV === "production") {
    const miniappPath = path.join(process.cwd(), "miniapp/dist");
    app.use("/miniapp", express.static(miniappPath));
    app.get("/miniapp/*", (req, res) => {
        res.sendFile(path.join(miniappPath, "index.html"));
    });
}

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    // Create and start bot
    const bot = createBot();

    if (process.env.NODE_ENV === "production") {
        await bot.init();
        console.log(`🔗 Webhook mode — set webhook to: ${process.env.TELEGRAM_WEBHOOK_URL}`);
    } else {
        // Long polling for development
        startBot(bot);
        console.log("🤖 Bot started in long polling mode");
    }

    setBotInstance(bot);

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
}

startServer().catch(console.error);
