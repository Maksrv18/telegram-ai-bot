import { Context } from "grammy";

export async function handleStart(ctx: Context): Promise<void> {
    const miniappUrl = process.env.MINIAPP_URL;

    const keyboard: any[][] = [];

    if (miniappUrl) {
        keyboard.push([
            { text: "🚀 Открыть Mini App", web_app: { url: miniappUrl } },
        ]);
    }

    keyboard.push(
        [
            { text: "🎨 Генерация", callback_data: "menu_generate" },
            { text: "✨ Улучшение", callback_data: "menu_enhance" },
        ],
        [
            { text: "🪄 Убрать фон", callback_data: "menu_removebg" },
            { text: "🎬 Видео", callback_data: "menu_video" },
        ]
    );

    await ctx.reply(
        `🤖 *Добро пожаловать в AI Bot\\!*\n\n` +
        `Я умею:\n` +
        `🎨 Генерировать изображения\n` +
        `✨ Улучшать фотографии\n` +
        `🪄 Убирать фон\n` +
        `🎬 Создавать видео\n` +
        `💬 Отвечать на вопросы\n\n` +
        `Используй кнопки ниже или открой Mini App для удобного интерфейса\\!`,
        {
            parse_mode: "MarkdownV2",
            reply_markup: {
                inline_keyboard: keyboard,
            },
        }
    );
}
