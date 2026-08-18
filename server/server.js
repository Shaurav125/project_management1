import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import { protect } from './middlewares/authMiddleware.js';
import { clerkMiddleware } from '@clerk/express';
import { inngest, functions } from './inngest/index.js';
import { serve } from "inngest/express";

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '../client');

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json());
    app.use(cors());

    // Safely enable Clerk middleware when key is provided
    if (process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.includes('placeholder')) {
        try {
            app.use(clerkMiddleware());
        } catch (e) {
            console.warn("Clerk middleware initialization note:", e.message);
        }
    }

    // Health Check
    app.get('/api/health', (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Webhooks
    app.use("/api/inngest", serve({ client: inngest, functions }));

    // Protected API Routes
    app.use("/api/workspaces", protect, workspaceRouter);
    app.use("/api/projects", protect, projectRouter);
    app.use("/api/tasks", protect, taskRouter);
    app.use("/api/comments", protect, commentRouter);

    // Development Vite middleware or Production static file serving
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            root: clientRoot,
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const rootDist = path.resolve(__dirname, '../dist');
        const clientDist = path.resolve(clientRoot, 'dist');
        const finalDistPath = fs.existsSync(path.resolve(rootDist, 'index.html')) ? rootDist : clientDist;
        app.use(express.static(finalDistPath));
        app.get('*all', (req, res) => {
            const indexPath = path.resolve(finalDistPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.send('<!doctype html><html><head><meta charset="utf-8"/><title>Project Management</title></head><body><div id="root"></div></body></html>');
            }
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Application server running on http://0.0.0.0:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error("Failed to start server:", err);
});
