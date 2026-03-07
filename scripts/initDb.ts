import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dbPath = process.env.DATABASE_PATH || "./data/bot.db";
const absoluteDbPath = path.resolve(__dirname, "..", dbPath);
const dbDir = path.dirname(absoluteDbPath);

// Create data directory if needed
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created directory: ${dbDir}`);
}

// Create database
const db = new Database(absoluteDbPath);
console.log(`📦 Database created at: ${absoluteDbPath}`);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Read and execute schema
const schemaPath = path.resolve(__dirname, "../database/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

db.exec(schema);
console.log("✅ Schema applied successfully!");

// Verify tables
const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];

console.log("\n📋 Tables created:");
tables.forEach((t) => console.log(`   - ${t.name}`));

db.close();
console.log("\n🎉 Database initialization complete!");
