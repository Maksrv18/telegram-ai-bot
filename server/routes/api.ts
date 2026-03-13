import { Router, Request, Response } from "express";
import { validateTelegramWebAppData, parseTelegramUser } from "../services/telegramService";
import { replicateService } from "../services/replicateService";
import * as storage from "../../bot/utils/storage";
import { botInstance } from "./webhook";

const router = Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authMiddleware(req: Request, res: Response, next: Function): void {
    const initData = req.headers["x-telegram-init-data"] as string;

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

// ─── GET /api/balance ─────────────────────────────────────────────────────────
router.get("/balance", authMiddleware, (req: Request, res: Response) => {
    try {
        const user = (req as any).telegramUser;
        const balance = storage.getUserBalance(user.id);
        res.json({ balance });
    } catch (err) {
        res.status(500).json({ error: "Failed to get balance" });
    }
});

// ─── POST /api/invoice ────────────────────────────────────────────────────────
router.post("/invoice", authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = (req as any).telegramUser;
        if (!botInstance) {
            res.status(500).json({ error: "Bot not available" });
            return;
        }

        const title = "Генерация AI";
        const description = "Оплата 1 генерации нейросети (1 ⭐️)";
        const payload = `gen_payment_${user.id}_${Date.now()}`;
        const currency = "XTR";
        const prices = [{ label: "1 Генерация", amount: 1 }];

        const invoiceLink = await botInstance.api.createInvoiceLink(
            title,
            description,
            payload,
            "", // provider_token (empty for Telegram Stars)
            currency,
            prices
        );

        res.json({ invoiceLink });
    } catch (err) {
        console.error("Invoice generation error:", err);
        res.status(500).json({ error: "Failed to create invoice" });
    }
});

// ─── POST /api/generate ───────────────────────────────────────────────────────
router.post("/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { type, prompt, model, imageUrl, videoUrl, targetLanguage, options } = req.body;
        const user = (req as any).telegramUser;

        storage.getOrCreateUser(user.id, user.username, user.first_name);

        const currentBalance = storage.getUserBalance(user.id);
        if (currentBalance < 1) {
            res.status(402).json({ error: "Insufficient Stars", requirePayment: true });
            return;
        }

        // Deduct star
        const success = storage.deductStar(user.id);
        if (!success) {
            res.status(402).json({ error: "Failed to deduct star" });
            return;
        }

        const genId = storage.createGeneration({
            userId: user.id,
            type: type || "image",
            model: model || type || "image",
            prompt,
            inputUrl: imageUrl || videoUrl,
        });

        processGeneration(genId, user.id, type, {
            prompt,
            model,
            imageUrl,
            videoUrl,
            targetLanguage,
            ...options,
        }).catch((err) => console.error("Generation error:", err));

        res.json({ generationId: genId, status: "processing" });
    } catch (err) {
        console.error("API generate error:", err);
        res.status(500).json({ error: "Failed to start generation" });
    }
});

// ─── GET /api/generation/:id ──────────────────────────────────────────────────
router.get("/generation/:id", authMiddleware, (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const generation = storage.getGeneration(id);

        if (!generation) {
            res.status(404).json({ error: "Not found" });
            return;
        }

        res.json({
            ...generation,
            output_urls: generation.output_urls ? JSON.parse(generation.output_urls) : null,
        });
    } catch (err) {
        console.error("API get generation error:", err);
        res.status(500).json({ error: "Failed to get generation" });
    }
});

// ─── GET /api/history ─────────────────────────────────────────────────────────
router.get("/history", authMiddleware, (req: Request, res: Response) => {
    try {
        const user = (req as any).telegramUser;
        const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
        const limit = parseInt(String(limitParam || "20"), 10) || 20;
        const history = storage.getUserHistory(user.id, limit);

        res.json(
            history.map((gen) => ({
                ...gen,
                output_urls: gen.output_urls ? JSON.parse(gen.output_urls) : null,
            }))
        );
    } catch (err) {
        console.error("API history error:", err);
        res.status(500).json({ error: "Failed to get history" });
    }
});

// ─── GET /api/models ──────────────────────────────────────────────────────────
router.get("/models", (_req: Request, res: Response) => {
    res.json({
        image: [
            {
                id: "nano_banana_pro",
                name: "Nano Banana Pro",
                emoji: "🎨",
                modelId: "google/nano-banana-pro",
                description: "Генерация и редактирование изображений",
                params: [
                    { key: "negativePrompt", label: "Без чего (negative)", type: "textarea", placeholder: "деформированные руки, плохое качество..." },
                    { key: "guidanceScale", label: "Guidance Scale", type: "slider", min: 1, max: 20, default: 7 },
                    { key: "aspectRatio", label: "Соотношение сторон", type: "select", options: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
                ],
            },
        ],
        removebg: [
            {
                id: "bria_removebg",
                name: "BRIA Remove BG",
                emoji: "🪄",
                modelId: "bria/remove-background",
                description: "Удаление фона AI",
                params: [],
            },
        ],
        video: [
            {
                id: "veo_fast",
                name: "Google Veo 3.1 Fast",
                emoji: "🎬",
                modelId: "google/veo-3.1-fast",
                description: "Генерация видео из текста",
                params: [
                    { key: "duration", label: "Длительность (сек)", type: "slider", min: 2, max: 10, default: 5 },
                    { key: "aspectRatio", label: "Соотношение сторон", type: "select", options: ["16:9", "9:16", "1:1"] },
                ],
            },
        ],
        tts: [
            {
                id: "qwen_tts",
                name: "Qwen3 TTS",
                emoji: "🎙️",
                modelId: "qwen/qwen3-tts",
                description: "Голосовая озвучка текста",
                params: [
                    { key: "voice", label: "Голос", type: "select", options: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] },
                    { key: "speed", label: "Скорость", type: "slider", min: 0.5, max: 2.0, default: 1.0, step: 0.1 },
                ],
            },
        ],
        videotranslate: [
            {
                id: "heygen_translate",
                name: "HeyGen Video Translate",
                emoji: "🌐",
                modelId: "heygen/video-translate",
                description: "Перевод видео с сохранением голоса",
                params: [
                    {
                        key: "targetLanguage", label: "Язык перевода", type: "select",
                        options: ["Russian", "English", "Spanish", "French", "German", "Chinese", "Japanese", "Arabic", "Portuguese"],
                    },
                    { key: "speakerGender", label: "Пол спикера", type: "select", options: ["male", "female"] },
                ],
            },
        ],
        chat: [
            {
                id: "gemini_flash",
                name: "Gemini 3 Flash",
                emoji: "💬",
                modelId: "google/gemini-3-flash",
                description: "Быстрый и умный AI-чат",
                params: [
                    { key: "systemPrompt", label: "Системный промпт", type: "textarea", placeholder: "You are a helpful assistant..." },
                    { key: "temperature", label: "Температура (креативность)", type: "slider", min: 0, max: 1, default: 0.7, step: 0.1 },
                    { key: "maxTokens", label: "Макс. токенов", type: "slider", min: 100, max: 2000, default: 800 },
                ],
            },
        ],
    });
});

// ─── Background processing ────────────────────────────────────────────────────
async function processGeneration(
    genId: number,
    userId: number,
    type: string,
    params: Record<string, any>
): Promise<void> {
    const startTime = Date.now();
    try {
        storage.updateGenerationStatus(genId, "processing");
        let outputUrls: string[] = [];

        switch (type) {
            case "image":
                outputUrls = await replicateService.generateImage(params.prompt || "", {
                    aspectRatio: params.aspectRatio,
                    numOutputs: params.numOutputs || 1,
                    negativePrompt: params.negativePrompt,
                    guidanceScale: params.guidanceScale,
                });
                break;

            case "removebg":
                if (!params.imageUrl) throw new Error("Image URL required");
                outputUrls = [await replicateService.removeBg(params.imageUrl)];
                break;

            case "video":
                outputUrls = [await replicateService.generateVideo(params.prompt || "", {
                    duration: params.duration,
                    aspectRatio: params.aspectRatio,
                })];
                break;

            case "tts":
                outputUrls = [await replicateService.textToSpeech(params.prompt || "", {
                    voice: params.voice,
                    language: params.language,
                    speed: params.speed,
                })];
                break;

            case "videotranslate":
                if (!params.videoUrl) throw new Error("Video URL required");
                outputUrls = [await replicateService.translateVideo(params.videoUrl, params.targetLanguage || "Russian", {
                    speakerGender: params.speakerGender,
                })];
                break;

            case "chat":
            case "gemini_chat":
                const response = await replicateService.chat(params.prompt || "", {
                    systemPrompt: params.systemPrompt,
                    temperature: params.temperature,
                    maxTokens: params.maxTokens,
                });
                outputUrls = [response];
                break;

            default:
                throw new Error(`Unknown type: ${type}`);
        }

        const processingTime = Date.now() - startTime;
        storage.updateGenerationStatus(genId, "done", outputUrls, undefined, processingTime);
    } catch (err) {
        const processingTime = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMessage, processingTime);

        // Auto refund User for failed generation
        try {
            storage.addStars(userId, 1);
            if (botInstance) {
                // Try to find the latest payment attempt for this user or use a general message to notify them
                await botInstance.api.sendMessage(userId, "⚠️ Ошибка при генерации. 1 ⭐️ была возвращена на ваш баланс.");
            }
        } catch (refundErr) {
            console.error("Auto-refund error:", refundErr);
        }
    }
}

export default router;
