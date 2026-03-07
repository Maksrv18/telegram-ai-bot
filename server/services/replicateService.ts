import replicate from "../../bot/utils/replicate";

export interface ImageGenOptions {
    model: "flux_schnell" | "flux_dev" | "sdxl";
    negativePrompt?: string;
    numOutputs?: number;
    aspectRatio?: string;
    quality?: number;
}

const IMAGE_MODELS: Record<string, string> = {
    flux_schnell: "black-forest-labs/flux-schnell",
    flux_dev: "black-forest-labs/flux-dev",
    sdxl: "stability-ai/sdxl:39ed52f2319f9da191ba09f0eedd887c5b010ce8b04f4e7a2a1e0ed5c214efa6",
};

const REMOVE_BG_MODEL =
    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

const UPSCALE_MODEL =
    "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

const VIDEO_MODEL = "minimax/video-01";

const LLM_MODEL = "meta/llama-3.1-8b-instruct";

export class ReplicateService {
    async runModel(
        model: string,
        input: Record<string, unknown>
    ): Promise<string[]> {
        const output = await replicate.run(model as `${string}/${string}`, { input });

        if (typeof output === "string") return [output];
        if (Array.isArray(output)) {
            return output.map((item) => {
                if (typeof item === "object" && item !== null && "url" in item) {
                    return (item as { url: () => string }).url();
                }
                return String(item);
            });
        }
        if (typeof output === "object" && output !== null && "url" in output) {
            return [(output as { url: () => string }).url()];
        }
        return [String(output)];
    }

    async generateImage(
        prompt: string,
        options: ImageGenOptions
    ): Promise<string[]> {
        const model = IMAGE_MODELS[options.model] || IMAGE_MODELS.flux_schnell;

        const input: Record<string, unknown> = {
            prompt,
            num_outputs: options.numOutputs || 1,
            aspect_ratio: options.aspectRatio || "1:1",
            output_format: "webp",
            output_quality: options.quality || 90,
        };

        if (options.model === "flux_schnell") {
            input.num_inference_steps = 4;
        } else if (options.model === "flux_dev") {
            input.num_inference_steps = 28;
        }

        if (options.negativePrompt && options.model === "sdxl") {
            input.negative_prompt = options.negativePrompt;
        }

        return this.runModel(model, input);
    }

    async removeBg(imageUrl: string): Promise<string> {
        const output = await this.runModel(REMOVE_BG_MODEL, {
            image: imageUrl,
        });
        return output[0];
    }

    async upscaleImage(imageUrl: string, scale: 2 | 4 = 4): Promise<string> {
        const output = await this.runModel(UPSCALE_MODEL, {
            image: imageUrl,
            scale,
            face_enhance: false,
        });
        return output[0];
    }

    async generateVideo(prompt: string): Promise<string> {
        const output = await this.runModel(VIDEO_MODEL, {
            prompt,
            prompt_optimizer: true,
        });
        return output[0];
    }

    async chat(message: string, systemPrompt?: string): Promise<string> {
        const output = await replicate.run(LLM_MODEL as `${string}/${string}`, {
            input: {
                prompt: message,
                system_prompt:
                    systemPrompt || "You are a helpful AI assistant. Answer concisely.",
                max_tokens: 500,
                temperature: 0.7,
            },
        });

        // Handle streaming output
        if (Symbol.asyncIterator in Object(output)) {
            let result = "";
            for await (const chunk of output as AsyncIterable<string>) {
                result += chunk;
            }
            return result;
        }

        if (Array.isArray(output)) {
            return output.join("");
        }

        return String(output);
    }
}

export const replicateService = new ReplicateService();
