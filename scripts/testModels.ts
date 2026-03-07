import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { ReplicateService } from "../server/services/replicateService";

async function testAllModels() {
    console.log("🧪 Тестирование всех моделей...\n");

    const service = new ReplicateService();

    // 1. Test image generation
    console.log("1️⃣ Генерация изображения (FLUX Schnell)...");
    try {
        const images = await service.generateImage(
            "a beautiful sunset over mountains, digital art",
            { model: "flux_schnell", numOutputs: 1, aspectRatio: "1:1" }
        );
        console.log("✅ URL:", images[0]);
    } catch (err) {
        console.error("❌ Ошибка:", err);
    }

    // 2. Test LLM
    console.log("\n2️⃣ Тест LLM (Llama 3.1)...");
    try {
        const response = await service.chat("Say 'it works!' and nothing else.");
        console.log("✅ Ответ:", response);
    } catch (err) {
        console.error("❌ Ошибка:", err);
    }

    console.log("\n🎉 Тестирование завершено!");
    console.log(
        "⚠️  Тесты removeBg, upscale и video пропущены для экономии API кредитов."
    );
    console.log(
        "    Раскомментируйте их ниже для полного теста.\n"
    );

    // Uncomment to test all models:
    // console.log("\n3️⃣ Удаление фона...");
    // const noBg = await service.removeBg(images[0]);
    // console.log("✅ URL:", noBg);

    // console.log("\n4️⃣ Upscale 4x...");
    // const upscaled = await service.upscaleImage(images[0], 4);
    // console.log("✅ URL:", upscaled);

    // console.log("\n5️⃣ Генерация видео...");
    // const videoUrl = await service.generateVideo("a cat playing piano");
    // console.log("✅ URL:", videoUrl);
}

testAllModels().catch(console.error);
