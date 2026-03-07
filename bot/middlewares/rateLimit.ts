import { Context, NextFunction } from "grammy";
import * as storage from "../utils/storage";

const LIMITS = {
    free: { perHour: 5, perDay: 20 },
    premium: { perHour: 30, perDay: 200 },
};

export async function rateLimitMiddleware(
    ctx: Context,
    next: NextFunction
): Promise<void> {
    if (!ctx.from) {
        await next();
        return;
    }

    // Only rate-limit commands that trigger API calls
    const text = ctx.message?.text || "";
    const isApiCommand =
        text.startsWith("/generate") ||
        text.startsWith("/enhance") ||
        text.startsWith("/removebg") ||
        text.startsWith("/video") ||
        text.startsWith("/ask");

    const hasPhoto = ctx.message?.photo !== undefined;

    if (!isApiCommand && !hasPhoto) {
        await next();
        return;
    }

    const user = storage.getOrCreateUser(ctx.from.id);
    const limits = user.is_premium ? LIMITS.premium : LIMITS.free;

    // Check hourly reset
    const lastHourReset = new Date(user.last_hour_reset).getTime();
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (lastHourReset < hourAgo) {
        storage.resetHourlyCount(ctx.from.id);
    }

    // Check daily reset
    const lastDayReset = new Date(user.last_day_reset).getTime();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (lastDayReset < dayAgo) {
        storage.resetDailyCount(ctx.from.id);
    }

    // Re-fetch after potential resets
    const updatedUser = storage.getOrCreateUser(ctx.from.id);

    if (updatedUser.requests_this_hour >= limits.perHour) {
        await ctx.reply(
            `⏳ Вы достигли лимита ${limits.perHour} запросов в час.\n` +
            `Подождите немного и попробуйте снова.\n\n` +
            `🌟 Premium: ${LIMITS.premium.perHour} запросов/час!`
        );
        return;
    }

    if (updatedUser.requests_today >= limits.perDay) {
        await ctx.reply(
            `⏳ Вы использовали ${limits.perDay}/${limits.perDay} запросов на сегодня.\n` +
            `Лимит обновится через 24 часа.\n\n` +
            `🌟 Premium: ${LIMITS.premium.perDay} запросов/день!`
        );
        return;
    }

    await next();
}
