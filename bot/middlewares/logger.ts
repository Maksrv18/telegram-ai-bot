import { Context, NextFunction } from "grammy";

export async function loggerMiddleware(
    ctx: Context,
    next: NextFunction
): Promise<void> {
    const start = Date.now();
    const user = ctx.from
        ? `${ctx.from.first_name} (${ctx.from.id})`
        : "unknown";
    const updateType = ctx.update ? Object.keys(ctx.update).filter(k => k !== 'update_id')[0] || 'unknown' : 'unknown';

    let details = "";
    if (ctx.message?.text) {
        details = ` text="${ctx.message.text.substring(0, 50)}"`;
    } else if (ctx.message?.photo) {
        details = " [photo]";
    } else if (ctx.callbackQuery?.data) {
        details = ` callback="${ctx.callbackQuery.data}"`;
    }

    console.log(`📨 [${updateType}] from ${user}${details}`);

    await next();

    const duration = Date.now() - start;
    if (duration > 100) {
        console.log(`⏱ [${updateType}] completed in ${duration}ms`);
    }
}
