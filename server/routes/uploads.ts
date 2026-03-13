import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure storage for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), "public/uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// POST /api/upload
router.post("/", upload.single("file"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const protocol = req.protocol;
        const host = req.get("host");
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({
            url: fileUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

export default router;
