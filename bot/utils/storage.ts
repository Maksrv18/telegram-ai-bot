import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const dbPath = process.env.DATABASE_PATH || "./data/bot.db";
const absoluteDbPath = path.resolve(__dirname, "../..", dbPath);

// Ensure directory exists
const dbDir = path.dirname(absoluteDbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize DB if it doesn't exist
if (!fs.existsSync(absoluteDbPath)) {
    const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    const db = new Database(absoluteDbPath);
    db.pragma("journal_mode = WAL");
    db.exec(schema);
    db.close();
}

const db = new Database(absoluteDbPath);
db.pragma("journal_mode = WAL");

// --- User operations ---

export interface User {
    id: number;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    is_premium: number;
    requests_today: number;
    requests_this_hour: number;
    requests_total: number;
    last_request_at: string | null;
    last_hour_reset: string;
    last_day_reset: string;
    created_at: string;
}

export interface Generation {
    id: number;
    user_id: number;
    type: string;
    model: string;
    prompt: string | null;
    input_url: string | null;
    output_urls: string | null;
    status: string;
    error_message: string | null;
    prediction_id: string | null;
    processing_time: number | null;
    created_at: string;
}

export function getOrCreateUser(
    telegramId: number,
    username?: string | null,
    firstName?: string | null
): User {
    const existing = db
        .prepare("SELECT * FROM users WHERE telegram_id = ?")
        .get(telegramId) as User | undefined;

    if (existing) {
        // Update username/first_name if changed
        if (username !== undefined || firstName !== undefined) {
            db.prepare(
                "UPDATE users SET username = COALESCE(?, username), first_name = COALESCE(?, first_name) WHERE telegram_id = ?"
            ).run(username ?? null, firstName ?? null, telegramId);
        }
        return db
            .prepare("SELECT * FROM users WHERE telegram_id = ?")
            .get(telegramId) as User;
    }

    db.prepare(
        "INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)"
    ).run(telegramId, username ?? null, firstName ?? null);

    // Create default settings
    db.prepare("INSERT INTO settings (user_id) VALUES (?)").run(telegramId);

    return db
        .prepare("SELECT * FROM users WHERE telegram_id = ?")
        .get(telegramId) as User;
}

export function incrementRequestCount(telegramId: number): void {
    const now = new Date().toISOString();
    db.prepare(
        `UPDATE users SET 
      requests_today = requests_today + 1, 
      requests_this_hour = requests_this_hour + 1,
      requests_total = requests_total + 1,
      last_request_at = ?
    WHERE telegram_id = ?`
    ).run(now, telegramId);
}

export function resetHourlyCount(telegramId: number): void {
    db.prepare(
        "UPDATE users SET requests_this_hour = 0, last_hour_reset = CURRENT_TIMESTAMP WHERE telegram_id = ?"
    ).run(telegramId);
}

export function resetDailyCount(telegramId: number): void {
    db.prepare(
        "UPDATE users SET requests_today = 0, last_day_reset = CURRENT_TIMESTAMP WHERE telegram_id = ?"
    ).run(telegramId);
}

// --- Generation operations ---

export function createGeneration(data: {
    userId: number;
    type: string;
    model: string;
    prompt?: string;
    inputUrl?: string;
}): number {
    const result = db
        .prepare(
            "INSERT INTO generations (user_id, type, model, prompt, input_url, status) VALUES (?, ?, ?, ?, ?, 'pending')"
        )
        .run(data.userId, data.type, data.model, data.prompt ?? null, data.inputUrl ?? null);

    return result.lastInsertRowid as number;
}

export function updateGenerationStatus(
    id: number,
    status: string,
    outputUrls?: string[],
    errorMessage?: string,
    processingTime?: number,
    predictionId?: string
): void {
    db.prepare(
        `UPDATE generations SET 
      status = ?,
      output_urls = COALESCE(?, output_urls),
      error_message = COALESCE(?, error_message),
      processing_time = COALESCE(?, processing_time),
      prediction_id = COALESCE(?, prediction_id)
    WHERE id = ?`
    ).run(
        status,
        outputUrls ? JSON.stringify(outputUrls) : null,
        errorMessage ?? null,
        processingTime ?? null,
        predictionId ?? null,
        id
    );
}

export function getGeneration(id: number): Generation | undefined {
    return db
        .prepare("SELECT * FROM generations WHERE id = ?")
        .get(id) as Generation | undefined;
}

export function getUserHistory(
    telegramId: number,
    limit: number = 20
): Generation[] {
    return db
        .prepare(
            "SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
        )
        .all(telegramId, limit) as Generation[];
}

// --- Settings operations ---

export interface UserSettings {
    user_id: number;
    preferred_model: string;
    preferred_ratio: string;
    notify_on_complete: number;
}

export function getUserSettings(telegramId: number): UserSettings | undefined {
    return db
        .prepare("SELECT * FROM settings WHERE user_id = ?")
        .get(telegramId) as UserSettings | undefined;
}

export function updateUserSettings(
    telegramId: number,
    settings: Partial<Omit<UserSettings, "user_id">>
): void {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (settings.preferred_model !== undefined) {
        updates.push("preferred_model = ?");
        values.push(settings.preferred_model);
    }
    if (settings.preferred_ratio !== undefined) {
        updates.push("preferred_ratio = ?");
        values.push(settings.preferred_ratio);
    }
    if (settings.notify_on_complete !== undefined) {
        updates.push("notify_on_complete = ?");
        values.push(settings.notify_on_complete);
    }

    if (updates.length > 0) {
        values.push(telegramId);
        db.prepare(`UPDATE settings SET ${updates.join(", ")} WHERE user_id = ?`).run(
            ...values
        );
    }
}

export function getDatabase(): Database.Database {
    return db;
}
