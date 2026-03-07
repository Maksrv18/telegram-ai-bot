import { Router, Request, Response } from "express";

// This will be set after the bot is created
let botInstance: any = null;

export function setBotInstance(bot: any): void {
    botInstance = bot;
}

const router = Router();

router.post("/", (req: Request, res: Response) => {
    if (!botInstance) {
        res.status(500).json({ error: "Bot not initialized" });
        return;
    }

    try {
        botInstance.handleUpdate(req.body);
        res.sendStatus(200);
    } catch (err) {
        console.error("Webhook error:", err);
        res.sendStatus(500);
    }
});

export default router;
