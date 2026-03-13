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
            imageInput?: string | string[];
            resolution?: string;
            outputFormat?: string;
            safetyFilterLevel?: string;
        } = {}
    ): Promise<string[]> {
        return this.runModel(IMAGE_MODEL, {
            prompt,
            aspect_ratio: options.aspectRatio || "1:1",
            num_outputs: options.numOutputs || 1,
            ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
            ...(options.guidanceScale ? { guidance_scale: options.guidanceScale } : {}),
            ...(options.imageInput ? { image_input: Array.isArray(options.imageInput) ? options.imageInput : [options.imageInput] } : {}),
            ...(options.resolution ? { resolution: options.resolution } : {}),
            ...(options.outputFormat ? { output_format: options.outputFormat } : {}),
            ...(options.safetyFilterLevel ? { safety_filter_level: options.safetyFilterLevel } : {}),
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
        options: {
            duration?: number;
            aspectRatio?: string;
            image?: string;
            negativePrompt?: string;
            resolution?: string;
        } = {}
    ): Promise<string> {
        const output = await this.runModel(VIDEO_MODEL, {
            prompt,
            ...(options.duration ? { duration: options.duration } : {}),
            ...(options.aspectRatio ? { aspect_ratio: options.aspectRatio } : {}),
            ...(options.image ? { image: options.image } : {}),
            ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
            ...(options.resolution ? { resolution: options.resolution } : {}),
        });
        return output[0];
    }

    // ── Text to Speech ───────────────────────────────────────────────────────
    async textToSpeech(
        text: string,
        options: {
            voice?: string;
            language?: string;
            speed?: number;
            refAudio?: string;
            refText?: string;
            voiceDescription?: string;
        } = {}
    ): Promise<string> {
        const input: any = { text };
        if (options.voice) input.voice = options.voice;
        if (options.language) input.language = options.language;
        if (options.speed) input.speed = options.speed;
        if (options.refAudio) input.ref_audio = options.refAudio;
        if (options.refText) input.ref_text = options.refText;
        if (options.voiceDescription) input.voice_description = options.voiceDescription;

        const output = await this.runModel(TTS_MODEL, input);
        return output[0];
    }

    // ── Video translation ────────────────────────────────────────────────────
    async translateVideo(
        videoUrl: string,
        targetLanguage: string,
        options: {
            speakerGender?: string;
            translationMode?: string;
            photoUrl?: string; // Potential Face Swap or Avatar Photo
        } = {}
    ): Promise<string> {
        const output = await this.runModel(VIDEO_TRANSLATE_MODEL, {
            video_url: videoUrl,
            target_language: targetLanguage,
            ...(options.speakerGender ? { speaker_gender: options.speakerGender } : {}),
            ...(options.translationMode ? { translation_mode: options.translationMode } : {}),
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
