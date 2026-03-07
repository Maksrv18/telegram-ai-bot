import { Router, Request, Response } from "express";
import {
    validateTelegramWebAppData,
    parseTelegramUser,
} from "../services/telegramService";
import { replicateService } from "../services/replicateService";
import * as storage from "../../bot/utils/storage";

const router = Router();

// Auth middleware for Mini App requests
function authMiddleware(req: Request, res: Response, next: Function): void {
    const initData = req.headers["x-telegram-init-data"] as string;

    // In development, allow requests without auth
    if (process.env.NODE_ENV === "development" && !initData) {
        (req as any).telegramUser = { id: 0, first_name: "Dev" };
        next();
        return;
    }

    if (!initData || !validateTelegramWebAppData(initData)) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const user = parseTelegramUser(initData);
    if (!user) {
        res.status(401).json({ error: "Invalid user data" });
        return;
    }

    (req as any).telegramUser = user;
    next();
}

// POST /api/generate - Start a generation
router.post("/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { type, prompt, model, imageUrl, options } = req.body;
        const user = (req as any).telegramUser;

        // Ensure user exists in DB
        storage.getOrCreateUser(user.id, user.username, user.first_name);

        // Create generation record
        const genId = storage.createGeneration({
            userId: user.id,
            type: type || "image",
            model: model || "flux_schnell",
            prompt,
            inputUrl: imageUrl,
        });

        // Process in background
        processGeneration(genId, type, { prompt, model, imageUrl, ...options }).catch(
            (err) => console.error("Generation error:", err)
        );

        res.json({ generationId: genId, status: "processing" });
    } catch (err) {
        console.error("API generate error:", err);
        res.status(500).json({ error: "Failed to start generation" });
    }
});

// GET /api/generation/:id - Get generation status
router.get("/generation/:id", authMiddleware, (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const generation = storage.getGeneration(id);

        if (!generation) {
            res.status(404).json({ error: "Generation not found" });
            return;
        }

        res.json({
            ...generation,
            output_urls: generation.output_urls
                ? JSON.parse(generation.output_urls)
                : null,
        });
    } catch (err) {
        console.error("API get generation error:", err);
        res.status(500).json({ error: "Failed to get generation" });
    }
});

// GET /api/history - User's generation history
router.get("/history", authMiddleware, (req: Request, res: Response) => {
    try {
        const user = (req as any).telegramUser;
        const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
        const limit = parseInt(String(limitParam || '20'), 10) || 20;
        const history = storage.getUserHistory(user.id, limit);

        const parsed = history.map((gen) => ({
            ...gen,
            output_urls: gen.output_urls ? JSON.parse(gen.output_urls) : null,
        }));

        res.json(parsed);
    } catch (err) {
        console.error("API history error:", err);
        res.status(500).json({ error: "Failed to get history" });
    }
});

// GET /api/models - Available models
router.get("/models", (_req: Request, res: Response) => {
    res.json({
        image: [
            {
                id: "flux_schnell",
                name: "FLUX Schnell",
                emoji: "⚡",
                description: "Быстрая генерация (~5 сек)",
            },
            {
                id: "flux_dev",
                name: "FLUX Dev",
                emoji: "🎯",
                description: "Высокое качество (~15 сек)",
            },
            {
                id: "sdxl",
                name: "SDXL",
                emoji: "🖼️",
                description: "Стабильная диффузия (~10 сек)",
            },
        ],
        video: [
            {
                id: "video_01",
                name: "Minimax Video",
                emoji: "🎬",
                description: "Текст в видео",
            },
        ],
        upscale: [
            {
                id: "real_esrgan",
                name: "Real-ESRGAN",
                emoji: "✨",
                description: "Улучшение до 4x",
            },
        ],
        removebg: [
            {
                id: "rembg",
                name: "RemBG",
                emoji: "🪄",
                description: "Удаление фона",
            },
        ],
    });
});

// Background processing
async function processGeneration(
    genId: number,
    type: string,
    params: {
        prompt?: string;
        model?: string;
        imageUrl?: string;
        aspectRatio?: string;
        numOutputs?: number;
        scale?: 2 | 4;
    }
): Promise<void> {
    const startTime = Date.now();

    try {
        storage.updateGenerationStatus(genId, "processing");
        let outputUrls: string[] = [];

        switch (type) {
            case "image":
                outputUrls = await replicateService.generateImage(params.prompt || "", {
                    model: (params.model as any) || "flux_schnell",
                    aspectRatio: params.aspectRatio || "1:1",
                    numOutputs: params.numOutputs || 1,
                });
                break;

            case "removebg":
                if (!params.imageUrl) throw new Error("Image URL required");
                const noBg = await replicateService.removeBg(params.imageUrl);
                outputUrls = [noBg];
                break;

            case "upscale":
                if (!params.imageUrl) throw new Error("Image URL required");
                const upscaled = await replicateService.upscaleImage(
                    params.imageUrl,
                    params.scale || 4
                );
                outputUrls = [upscaled];
                break;

            case "video":
                const video = await replicateService.generateVideo(params.prompt || "");
                outputUrls = [video];
                break;

            case "chat":
                const response = await replicateService.chat(params.prompt || "");
                outputUrls = [response];
                break;

            default:
                throw new Error(`Unknown generation type: ${type}`);
        }

        const processingTime = Date.now() - startTime;
        storage.updateGenerationStatus(genId, "done", outputUrls, undefined, processingTime);
    } catch (err) {
        const processingTime = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMessage, processingTime);
    }
}

export default router;
