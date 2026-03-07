import { Context, NextFunction } from "grammy";
import * as storage from "../utils/storage";

export async function authMiddleware(
    ctx: Context,
    next: NextFunction
): Promise<void> {
    if (!ctx.from) {
        return;
    }

    // Register or update user
    storage.getOrCreateUser(
        ctx.from.id,
        ctx.from.username,
        ctx.from.first_name
    );

    await next();
}
