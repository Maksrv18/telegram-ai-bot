import { Router, Request, Response } from "express";
import fetch from "node-fetch";

const router = Router();

// Proxy file downloads to bypass CORS in the Mini App
router.get("/", async (req: Request, res: Response) => {
    const fileUrl = req.query.url as string;

    if (!fileUrl) {
        res.status(400).send("Missing URL parameter");
        return;
    }

    try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
            res.status(response.status).send(`Failed to fetch file: ${response.statusText}`);
            return;
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Suggest a filename if possible
        const filename = fileUrl.split('/').pop() || 'downloaded_file';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream the pipe directly
        response.body.pipe(res);
    } catch (error) {
        console.error("Proxy download error:", error);
        res.status(500).send("Internal server error during download");
    }
});

export default router;
