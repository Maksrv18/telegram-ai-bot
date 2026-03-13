import replicate from "../../bot/utils/replicate";

// ─── Model identifiers ───────────────────────────────────────────────────────
const IMAGE_MODEL = "google/nano-banana-pro";
const REMOVE_BG_MODEL = "bria/remove-background";
const VIDEO_MODEL = "google/veo-3.1-fast";
const TTS_MODEL = "qwen/qwen3-tts";
const VIDEO_TRANSLATE_MODEL = "heygen/video-translate";
const CHAT_MODEL = "google/gemini-3-flash";

// ─── Helpers ─────────────────────────────────────────────────────────────────
export class ReplicateService {
    async runModel(model: string, input: Record<string, unknown>): Promise<string[]> {
        const output = await replicate.run(model as `${string}/${string}`, { input });

        if (typeof output === "string") return [output];
        if (Array.isArray(output)) {
            return output.map((item) => {
                if (item && typeof item === "object" && "url" in item) {
                    return (item as { url: () => string }).url();
                }
                return String(item);
            });
        }
        if (output && typeof output === "object" && "url" in output) {
            return [(output as { url: () => string }).url()];
        }
        return [String(output)];
    }

    // ── Image generation/editing ─────────────────────────────────────────────
    async generateImage(
        prompt: string,
        options: {
            aspectRatio?: string;
            numOutputs?: number;
            negativePrompt?: string;
            guidanceScale?: number;
        } = {}
    ): Promise<string[]> {
        return this.runModel(IMAGE_MODEL, {
            prompt,
            aspect_ratio: options.aspectRatio || "1:1",
            num_outputs: options.numOutputs || 1,
            ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
            ...(options.guidanceScale ? { guidance_scale: options.guidanceScale } : {}),
        });
    }

    // ── Background removal ───────────────────────────────────────────────────
    async removeBg(imageUrl: string): Promise<string> {
        const output = await this.runModel(REMOVE_BG_MODEL, { image: imageUrl });
        return output[0];
    }

    // ── Video generation ─────────────────────────────────────────────────────
    async generateVideo(
        prompt: string,
        options: { duration?: number; aspectRatio?: string } = {}
    ): Promise<string> {
        const output = await this.runModel(VIDEO_MODEL, {
            prompt,
            ...(options.duration ? { duration: options.duration } : {}),
            ...(options.aspectRatio ? { aspect_ratio: options.aspectRatio } : {}),
        });
        return output[0];
    }

    // ── Text to Speech ───────────────────────────────────────────────────────
    async textToSpeech(
        text: string,
        options: { voice?: string; language?: string; speed?: number } = {}
    ): Promise<string> {
        const output = await this.runModel(TTS_MODEL, {
            text,
            ...(options.voice ? { voice: options.voice } : {}),
            ...(options.language ? { language: options.language } : {}),
            ...(options.speed ? { speed: options.speed } : {}),
        });
        return output[0];
    }

    // ── Video translation ────────────────────────────────────────────────────
    async translateVideo(
        videoUrl: string,
        targetLanguage: string,
        options: { speakerGender?: string } = {}
    ): Promise<string> {
        const output = await this.runModel(VIDEO_TRANSLATE_MODEL, {
            video_url: videoUrl,
            target_language: targetLanguage,
            ...(options.speakerGender ? { speaker_gender: options.speakerGender } : {}),
        });
        return output[0];
    }

    // ── AI Chat (Gemini) ─────────────────────────────────────────────────────
    async chat(
        message: string,
        options: { systemPrompt?: string; temperature?: number; maxTokens?: number } = {}
    ): Promise<string> {
        const output = await replicate.run(CHAT_MODEL as `${string}/${string}`, {
            input: {
                prompt: message,
                system_prompt: options.systemPrompt || "You are a helpful AI assistant. Reply in the same language as the user. Be concise but thorough.",
                max_tokens: options.maxTokens || 800,
                temperature: options.temperature || 0.7,
            },
        });

        // Handle streaming or array output
        if (output && Symbol.asyncIterator in Object(output)) {
            let result = "";
            for await (const chunk of output as AsyncIterable<string>) {
                result += chunk;
            }
            return result;
        }
        if (Array.isArray(output)) return output.join("");
        return String(output);
    }
}

export const replicateService = new ReplicateService();
