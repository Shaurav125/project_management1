import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import { protect } from './middlewares/authMiddleware.js';
import { clerkMiddleware } from '@clerk/express';
import { inngest, functions } from './inngest/index.js';
import { serve } from "inngest/express";
import { checkDatabaseHealth } from './configs/prisma.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '../client');

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

// Health Check & Database Status
app.get('/api/health', (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get('/api/db-status', async (req, res) => {
    const dbStatus = await checkDatabaseHealth();
    res.json(dbStatus);
});

// Comprehensive API & Integration Status Endpoint
app.get('/api/system-status', async (req, res) => {
    const dbStatus = await checkDatabaseHealth();

    const clerkPublishable = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || '';
    const clerkSecret = process.env.CLERK_SECRET_KEY || '';
    const isClerkLive = Boolean(clerkPublishable && !clerkPublishable.includes('placeholder') && (clerkPublishable.startsWith('pk_test_') || clerkPublishable.startsWith('pk_live_')));

    const inngestConfigured = Boolean(process.env.INNGEST_EVENT_KEY && !process.env.INNGEST_EVENT_KEY.includes('placeholder'));
    const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && !process.env.SMTP_USER.includes('placeholder'));

    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        integrations: {
            clerk: {
                name: "Clerk Authentication",
                status: isClerkLive ? "configured (live mode)" : "ready (development fallback active)",
                publishableKeyConfigured: Boolean(clerkPublishable),
                secretKeyConfigured: Boolean(clerkSecret),
                activeMode: isClerkLive ? "Production / Live Clerk" : "Local / Demo Auth Context",
            },
            database: {
                name: "Neon Database / PostgreSQL",
                ...dbStatus,
            },
            inngest: {
                name: "Inngest Event Orchestration",
                status: inngestConfigured ? "configured" : "ready (local events)",
                eventKeyConfigured: inngestConfigured,
                registeredFunctions: functions.length,
            },
            smtp: {
                name: "Nodemailer (Email Service)",
                status: smtpConfigured ? "configured" : "ready (simulated email logs)",
                senderEmail: process.env.SENDER_EMAIL || "notifications@workspace.local",
                configured: smtpConfigured,
            },
        },
        endpoints: {
            health: "/api/health",
            workspaces: "/api/workspaces",
            projects: "/api/projects",
            tasks: "/api/tasks",
            comments: "/api/comments",
            inngest: "/api/inngest",
        }
    });
});


// Webhooks
app.use("/api/inngest", serve({ client: inngest, functions }));

// Protected API Routes
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/tasks", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);

async function setupServer() {
    // Development Vite middleware or Production static file serving
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        try {
            const { createServer: createViteServer } = await import('vite');
            const vite = await createViteServer({
                root: clientRoot,
                server: { middlewareMode: true },
                appType: 'spa',
            });
            app.use(vite.middlewares);

            // Development SPA fallback to guarantee index.html loads for all client routes
            app.use(async (req, res, next) => {
                if (req.method !== 'GET' || req.path.startsWith('/api')) {
                    return next();
                }
                try {
                    const indexPath = path.resolve(clientRoot, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        let template = fs.readFileSync(indexPath, 'utf-8');
                        template = await vite.transformIndexHtml(req.originalUrl || '/', template);
                        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
                    } else {
                        next();
                    }
                } catch (e) {
                    vite.ssrFixStacktrace(e);
                    next(e);
                }
            });
        } catch (e) {
            console.warn("Vite middleware note:", e.message);
        }
    } else {
        const rootDist = path.resolve(__dirname, '../dist');
        const clientDist = path.resolve(clientRoot, 'dist');
        const finalDistPath = fs.existsSync(path.resolve(rootDist, 'index.html')) ? rootDist : clientDist;
        app.use(express.static(finalDistPath));
        
        // Universal catch-all for SPA client-side routing in production
        app.use((req, res, next) => {
            if (req.method === 'GET' && !req.path.startsWith('/api')) {
                const indexPath = path.resolve(finalDistPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    return res.sendFile(indexPath);
                }
                return res.send('<!doctype html><html><head><meta charset="utf-8"/><title>Project Management</title></head><body><div id="root"></div></body></html>');
            }
            next();
        });
    }

    if (!process.env.VERCEL) {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Application server running on http://0.0.0.0:${PORT}`);
        });
    }
}

setupServer().catch((err) => {
    console.error("Server startup note:", err);
});

export default app;
