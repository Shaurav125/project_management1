import "dotenv/config";
import { randomUUID } from "crypto";

const uuidv4 = () => randomUUID();

// Initialize Seed In-Memory Store
const store = {
    users: [
        {
            id: "user_1",
            name: "Alex Smith",
            email: "alexsmith@example.com",
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
            id: "user_2",
            name: "John Warrel",
            email: "johnwarrel@example.com",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
            createdAt: new Date("2024-01-02T00:00:00Z"),
            updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
        {
            id: "user_3",
            name: "Oliver Watts",
            email: "oliverwatts@example.com",
            image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80",
            createdAt: new Date("2024-01-03T00:00:00Z"),
            updatedAt: new Date("2024-01-03T00:00:00Z"),
        }
    ],
    workspaces: [
        {
            id: "org_1",
            name: "Engineering & Product",
            org_name: "Apex Global",
            slug: "engineering-product",
            description: "Main workspace for cross-functional product management",
            settings: {},
            ownerId: "user_1",
            image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
        }
    ],
    workspaceMembers: [
        { id: "wsm_1", userId: "user_1", workspaceId: "org_1", role: "ADMIN", message: "" },
        { id: "wsm_2", userId: "user_2", workspaceId: "org_1", role: "ADMIN", message: "" },
        { id: "wsm_3", userId: "user_3", workspaceId: "org_1", role: "ADMIN", message: "" },
    ],
    projects: [
        {
            id: "proj_1",
            name: "LaunchPad CRM",
            description: "A next-gen CRM for startups to manage customer pipelines, analytics, and automation.",
            priority: "HIGH",
            status: "ACTIVE",
            start_date: new Date("2025-01-10T00:00:00Z"),
            end_date: new Date("2026-02-28T00:00:00Z"),
            team_lead: "user_1",
            workspaceId: "org_1",
            progress: 65,
            createdAt: new Date("2025-01-10T00:00:00Z"),
            updatedAt: new Date("2025-01-10T00:00:00Z"),
        },
        {
            id: "proj_2",
            name: "Cloud Infrastructure Migration",
            description: "Migrating legacy services to modern containerized microservices architecture",
            priority: "MEDIUM",
            status: "ACTIVE",
            start_date: new Date("2025-02-01T00:00:00Z"),
            end_date: new Date("2025-05-15T00:00:00Z"),
            team_lead: "user_2",
            workspaceId: "org_1",
            progress: 70,
            createdAt: new Date("2025-02-01T00:00:00Z"),
            updatedAt: new Date("2025-02-01T00:00:00Z"),
        },
        {
            id: "proj_3",
            name: "Design System & Components",
            description: "Unified token architecture, accessible typography, and components",
            priority: "LOW",
            status: "PLANNING",
            start_date: new Date("2025-03-01T00:00:00Z"),
            end_date: new Date("2025-06-30T00:00:00Z"),
            team_lead: "user_3",
            workspaceId: "org_1",
            progress: 20,
            createdAt: new Date("2025-03-01T00:00:00Z"),
            updatedAt: new Date("2025-03-01T00:00:00Z"),
        }
    ],
    projectMembers: [
        { id: "pm_1", userId: "user_1", projectId: "proj_1" },
        { id: "pm_2", userId: "user_2", projectId: "proj_1" },
        { id: "pm_3", userId: "user_3", projectId: "proj_1" },
        { id: "pm_4", userId: "user_2", projectId: "proj_2" },
        { id: "pm_5", userId: "user_1", projectId: "proj_2" },
        { id: "pm_6", userId: "user_3", projectId: "proj_3" },
    ],
    tasks: [
        {
            id: "task_1",
            projectId: "proj_1",
            title: "Implement biometric authentication",
            description: "Integrate FaceID and TouchID login with fallback passcode flow",
            status: "IN_PROGRESS",
            type: "FEATURE",
            priority: "HIGH",
            assigneeId: "user_1",
            due_date: new Date("2025-04-15T00:00:00Z"),
            createdAt: new Date("2025-01-12T00:00:00Z"),
            updatedAt: new Date("2025-01-12T00:00:00Z"),
        },
        {
            id: "task_2",
            projectId: "proj_1",
            title: "Fix push notification badge sync bug",
            description: "Ensure unread count updates correctly after background app refresh",
            status: "TODO",
            type: "BUG",
            priority: "MEDIUM",
            assigneeId: "user_2",
            due_date: new Date("2025-04-10T00:00:00Z"),
            createdAt: new Date("2025-01-14T00:00:00Z"),
            updatedAt: new Date("2025-01-14T00:00:00Z"),
        },
        {
            id: "task_3",
            projectId: "proj_1",
            title: "Optimize startup rendering performance",
            description: "Profile and eliminate redundant bundle evaluation on cold startup",
            status: "DONE",
            type: "IMPROVEMENT",
            priority: "LOW",
            assigneeId: "user_3",
            due_date: new Date("2025-03-25T00:00:00Z"),
            createdAt: new Date("2025-01-15T00:00:00Z"),
            updatedAt: new Date("2025-01-15T00:00:00Z"),
        },
        {
            id: "task_4",
            projectId: "proj_2",
            title: "Provision Terraform staging cluster",
            description: "Configure VPC peering, ingress controllers, and auto-scaling node pools",
            status: "IN_PROGRESS",
            type: "TASK",
            priority: "HIGH",
            assigneeId: "user_2",
            due_date: new Date("2025-04-20T00:00:00Z"),
            createdAt: new Date("2025-02-05T00:00:00Z"),
            updatedAt: new Date("2025-02-05T00:00:00Z"),
        },
        {
            id: "task_5",
            projectId: "proj_2",
            title: "Setup automated blue/green deployment pipeline",
            description: "Implement automated canary analysis and zero-downtime rollback",
            status: "TODO",
            type: "FEATURE",
            priority: "MEDIUM",
            assigneeId: "user_1",
            due_date: new Date("2025-05-01T00:00:00Z"),
            createdAt: new Date("2025-02-10T00:00:00Z"),
            updatedAt: new Date("2025-02-10T00:00:00Z"),
        },
        {
            id: "task_6",
            projectId: "proj_3",
            title: "Publish color tokens and typography scale",
            description: "Export JSON design tokens and generate Tailwind utility preset",
            status: "DONE",
            type: "TASK",
            priority: "LOW",
            assigneeId: "user_3",
            due_date: new Date("2025-03-15T00:00:00Z"),
            createdAt: new Date("2025-03-02T00:00:00Z"),
            updatedAt: new Date("2025-03-02T00:00:00Z"),
        }
    ],
    comments: [
        {
            id: "comm_1",
            content: "Testing on iOS simulator shows smooth biometric handshake.",
            userId: "user_1",
            taskId: "task_1",
            createdAt: new Date("2025-01-13T10:30:00Z"),
        },
        {
            id: "comm_2",
            content: "Looks solid! Let me know if you want a review on the secure enclave module.",
            userId: "user_2",
            taskId: "task_1",
            createdAt: new Date("2025-01-13T11:00:00Z"),
        }
    ]
};

// Helper to populate relations
function enrichUser(user) {
    if (!user) return null;
    return { ...user };
}

function enrichTask(task) {
    if (!task) return null;
    const assignee = store.users.find(u => u.id === task.assigneeId);
    const comments = store.comments
        .filter(c => c.taskId === task.id)
        .map(enrichComment);
    return {
        ...task,
        assignee: enrichUser(assignee),
        comments,
    };
}

function enrichComment(comment) {
    if (!comment) return null;
    const user = store.users.find(u => u.id === comment.userId);
    return {
        ...comment,
        user: enrichUser(user),
    };
}

function enrichProject(project) {
    if (!project) return null;
    const members = store.projectMembers
        .filter(pm => pm.projectId === project.id)
        .map(pm => {
            const user = store.users.find(u => u.id === pm.userId);
            return {
                ...pm,
                user: enrichUser(user),
            };
        });
    const tasks = store.tasks
        .filter(t => t.projectId === project.id)
        .map(enrichTask);
    const owner = store.users.find(u => u.id === project.team_lead);

    return {
        ...project,
        members,
        tasks,
        owner: enrichUser(owner),
    };
}

function enrichWorkspace(workspace) {
    if (!workspace) return null;
    const members = store.workspaceMembers
        .filter(wm => wm.workspaceId === workspace.id)
        .map(wm => {
            const user = store.users.find(u => u.id === wm.userId);
            return {
                ...wm,
                user: enrichUser(user),
            };
        });
    const projects = store.projects
        .filter(p => p.workspaceId === workspace.id)
        .map(enrichProject);
    const owner = store.users.find(u => u.id === workspace.ownerId);

    return {
        ...workspace,
        org_name: workspace.org_name || workspace.orgName || workspace.organizationName || "Apex Global",
        orgName: workspace.org_name || workspace.orgName || workspace.organizationName || "Apex Global",
        image_url: workspace.image_url || workspace.imageUrl || workspace.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
        members,
        projects,
        owner: enrichUser(owner),
    };
}

// In-Memory Prisma Mock
const mockPrisma = {
    user: {
        findUnique: async ({ where, select }) => {
            let u = null;
            if (where?.id) u = store.users.find(item => item.id === where.id);
            else if (where?.email) u = store.users.find(item => item.email === where.email);
            if (!u) return null;
            if (select) {
                const res = {};
                for (const key of Object.keys(select)) {
                    if (select[key]) res[key] = u[key];
                }
                return res;
            }
            return enrichUser(u);
        },
        create: async ({ data }) => {
            const newUser = {
                id: data.id || `user_${Date.now()}`,
                name: data.name || "New User",
                email: data.email || "",
                image: data.image || "",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            store.users.push(newUser);
            return enrichUser(newUser);
        },
        update: async ({ where, data }) => {
            const idx = store.users.findIndex(u => (where.id && u.id === where.id) || (where.email && u.email === where.email));
            if (idx === -1) return null;
            store.users[idx] = { ...store.users[idx], ...data, updatedAt: new Date() };
            return enrichUser(store.users[idx]);
        },
        delete: async ({ where }) => {
            const idx = store.users.findIndex(u => u.id === where.id);
            if (idx === -1) return null;
            const deleted = store.users.splice(idx, 1)[0];
            return enrichUser(deleted);
        },
    },

    workspace: {
        findMany: async ({ where }) => {
            let list = store.workspaces;
            if (where?.members?.some?.userId) {
                const targetUserId = where.members.some.userId;
                const memberWsIds = store.workspaceMembers
                    .filter(wm => wm.userId === targetUserId)
                    .map(wm => wm.workspaceId);
                list = list.filter(w => memberWsIds.includes(w.id));
            }
            return list.map(enrichWorkspace);
        },
        findUnique: async ({ where }) => {
            let w = null;
            if (where?.id) w = store.workspaces.find(item => item.id === where.id);
            else if (where?.slug) w = store.workspaces.find(item => item.slug === where.slug);
            if (!w) return null;
            return enrichWorkspace(w);
        },
        create: async ({ data }) => {
            const newWs = {
                id: data.id || `ws_${Date.now()}`,
                name: data.name || "Untitled Workspace",
                org_name: data.org_name || data.orgName || data.organizationName || data.name || "Apex Global",
                slug: data.slug || `ws-${Date.now()}`,
                description: data.description || "",
                settings: data.settings || {},
                ownerId: data.ownerId || "user_1",
                image_url: data.image_url || data.imageUrl || data.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            store.workspaces.push(newWs);
            return enrichWorkspace(newWs);
        },
        update: async ({ where, data }) => {
            const idx = store.workspaces.findIndex(w => w.id === where.id);
            if (idx === -1) return null;
            store.workspaces[idx] = {
                ...store.workspaces[idx],
                ...data,
                org_name: data.org_name || data.orgName || data.organizationName || store.workspaces[idx].org_name,
                image_url: data.image_url || data.imageUrl || data.logo || store.workspaces[idx].image_url,
                updatedAt: new Date(),
            };
            return enrichWorkspace(store.workspaces[idx]);
        },
        delete: async ({ where }) => {
            const idx = store.workspaces.findIndex(w => w.id === where.id);
            if (idx === -1) return null;
            const deleted = store.workspaces.splice(idx, 1)[0];
            return enrichWorkspace(deleted);
        },
    },

    workspaceMember: {
        findUnique: async ({ where }) => {
            let wm = null;
            if (where?.id) wm = store.workspaceMembers.find(item => item.id === where.id);
            else if (where?.userId_workspaceId) {
                wm = store.workspaceMembers.find(
                    item => item.userId === where.userId_workspaceId.userId && item.workspaceId === where.userId_workspaceId.workspaceId
                );
            }
            return wm ? { ...wm } : null;
        },
        create: async ({ data }) => {
            const newWm = {
                id: uuidv4(),
                userId: data.userId,
                workspaceId: data.workspaceId,
                role: data.role || "MEMBER",
                message: data.message || "",
            };
            store.workspaceMembers.push(newWm);
            return { ...newWm };
        },
        deleteMany: async ({ where }) => {
            const initialLen = store.workspaceMembers.length;
            if (where?.workspaceId && where?.userId) {
                store.workspaceMembers = store.workspaceMembers.filter(
                    wm => !(wm.workspaceId === where.workspaceId && wm.userId === where.userId)
                );
            } else if (where?.workspaceId) {
                store.workspaceMembers = store.workspaceMembers.filter(wm => wm.workspaceId !== where.workspaceId);
            }
            return { count: initialLen - store.workspaceMembers.length };
        },
    },

    project: {
        findUnique: async ({ where }) => {
            const p = store.projects.find(item => item.id === where.id);
            if (!p) return null;
            return enrichProject(p);
        },
        create: async ({ data }) => {
            const newProj = {
                id: uuidv4(),
                name: data.name,
                description: data.description || "",
                priority: data.priority || "MEDIUM",
                status: data.status || "ACTIVE",
                start_date: data.start_date ? new Date(data.start_date) : new Date(),
                end_date: data.end_date ? new Date(data.end_date) : null,
                team_lead: data.team_lead,
                workspaceId: data.workspaceId,
                progress: data.progress || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            store.projects.push(newProj);
            return enrichProject(newProj);
        },
        update: async ({ where, data }) => {
            const idx = store.projects.findIndex(p => p.id === where.id);
            if (idx === -1) return null;
            store.projects[idx] = {
                ...store.projects[idx],
                ...data,
                start_date: data.start_date ? new Date(data.start_date) : store.projects[idx].start_date,
                end_date: data.end_date ? new Date(data.end_date) : store.projects[idx].end_date,
                updatedAt: new Date(),
            };
            return enrichProject(store.projects[idx]);
        },
        delete: async ({ where }) => {
            const idx = store.projects.findIndex(p => p.id === where.id);
            if (idx === -1) return null;
            const deleted = store.projects.splice(idx, 1)[0];
            return enrichProject(deleted);
        },
        deleteMany: async ({ where }) => {
            const initialLen = store.projects.length;
            if (where?.id?.in) {
                store.projects = store.projects.filter(p => !where.id.in.includes(p.id));
            } else if (where?.id) {
                store.projects = store.projects.filter(p => p.id !== where.id);
            } else if (where?.workspaceId) {
                store.projects = store.projects.filter(p => p.workspaceId !== where.workspaceId);
            }
            return { count: initialLen - store.projects.length };
        },
    },

    projectMember: {
        create: async ({ data }) => {
            const newPm = {
                id: uuidv4(),
                userId: data.userId,
                projectId: data.projectId,
            };
            store.projectMembers.push(newPm);
            return { ...newPm };
        },
        createMany: async ({ data }) => {
            const items = Array.isArray(data) ? data : [data];
            const added = [];
            for (const item of items) {
                const newPm = {
                    id: uuidv4(),
                    userId: item.userId,
                    projectId: item.projectId,
                };
                store.projectMembers.push(newPm);
                added.push(newPm);
            }
            return { count: added.length };
        },
        deleteMany: async ({ where }) => {
            const initialLen = store.projectMembers.length;
            if (where?.projectId && where?.userId) {
                store.projectMembers = store.projectMembers.filter(
                    pm => !(pm.projectId === where.projectId && pm.userId === where.userId)
                );
            } else if (where?.projectId) {
                store.projectMembers = store.projectMembers.filter(pm => pm.projectId !== where.projectId);
            }
            return { count: initialLen - store.projectMembers.length };
        },
    },

    task: {
        findUnique: async ({ where }) => {
            const t = store.tasks.find(item => item.id === where.id);
            if (!t) return null;
            return enrichTask(t);
        },
        findMany: async ({ where }) => {
            let list = store.tasks;
            if (where?.projectId) list = list.filter(t => t.projectId === where.projectId);
            if (where?.assigneeId) list = list.filter(t => t.assigneeId === where.assigneeId);
            return list.map(enrichTask);
        },
        create: async ({ data }) => {
            const newTask = {
                id: uuidv4(),
                projectId: data.projectId,
                title: data.title,
                description: data.description || "",
                status: data.status || "TODO",
                type: data.type || "TASK",
                priority: data.priority || "MEDIUM",
                assigneeId: data.assigneeId,
                due_date: data.due_date ? new Date(data.due_date) : new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            store.tasks.push(newTask);
            return enrichTask(newTask);
        },
        update: async ({ where, data }) => {
            const idx = store.tasks.findIndex(t => t.id === where.id);
            if (idx === -1) return null;
            store.tasks[idx] = {
                ...store.tasks[idx],
                ...data,
                due_date: data.due_date ? new Date(data.due_date) : store.tasks[idx].due_date,
                updatedAt: new Date(),
            };
            return enrichTask(store.tasks[idx]);
        },
        deleteMany: async ({ where }) => {
            let initialLen = store.tasks.length;
            if (where?.id?.in) {
                store.tasks = store.tasks.filter(t => !where.id.in.includes(t.id));
            } else if (where?.id) {
                store.tasks = store.tasks.filter(t => t.id !== where.id);
            } else if (where?.projectId) {
                store.tasks = store.tasks.filter(t => t.projectId !== where.projectId);
            }
            return { count: initialLen - store.tasks.length };
        },
        delete: async ({ where }) => {
            const idx = store.tasks.findIndex(t => t.id === where.id);
            if (idx === -1) return null;
            const deleted = store.tasks.splice(idx, 1)[0];
            return enrichTask(deleted);
        },
    },

    comment: {
        findMany: async ({ where }) => {
            let list = store.comments;
            if (where?.taskId) list = list.filter(c => c.taskId === where.taskId);
            return list.map(enrichComment);
        },
        create: async ({ data }) => {
            const newComment = {
                id: uuidv4(),
                content: data.content,
                userId: data.userId,
                taskId: data.taskId,
                createdAt: new Date(),
            };
            store.comments.push(newComment);
            return enrichComment(newComment);
        },
    },
};

let prismaInstance = mockPrisma;
let databaseEngine = "in-memory-seed";
let dbConnectionError = null;

async function initDatabase() {
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!dbUrl || (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://"))) {
        console.log("[Database] Running with In-Memory Seed Store (DATABASE_URL not set or not postgres).");
        return;
    }

    try {
        console.log("[Database] Attempting connection to Neon/PostgreSQL database...");
        
        // Try Neon Serverless Adapter first if Neon URL
        if (dbUrl.includes("neon.tech") || dbUrl.includes("neon")) {
            try {
                const { Pool, neonConfig } = await import("@neondatabase/serverless");
                const { PrismaNeon } = await import("@prisma/adapter-neon");
                const { PrismaClient } = await import("@prisma/client");
                const ws = (await import("ws")).default;

                neonConfig.webSocketConstructor = ws;
                const pool = new Pool({ connectionString: dbUrl });
                const adapter = new PrismaNeon(pool);
                const client = new PrismaClient({ adapter });

                // Verify with a test query
                await client.$queryRaw`SELECT 1 as connected`;
                prismaInstance = client;
                databaseEngine = "neon-serverless-prisma";
                dbConnectionError = null;
                console.log("[Database] Successfully connected to Neon Database via Prisma Neon Adapter!");
                return;
            } catch (neonErr) {
                console.warn("[Database] Neon adapter connection warning, attempting standard PrismaClient:", neonErr.message);
            }
        }

        // Fallback to standard PrismaClient
        const { PrismaClient } = await import("@prisma/client");
        const client = new PrismaClient();
        await client.$queryRaw`SELECT 1 as connected`;
        prismaInstance = client;
        databaseEngine = "postgresql-prisma";
        dbConnectionError = null;
        console.log("[Database] Successfully connected to PostgreSQL via PrismaClient!");
    } catch (err) {
        dbConnectionError = err.message;
        console.warn("[Database] Failed to connect to remote database. Falling back smoothly to In-Memory Seed Store:", err.message);
        prismaInstance = mockPrisma;
        databaseEngine = "in-memory-seed";
    }
}

// Kick off async DB initialization (non-blocking)
initDatabase().catch((err) => {
    console.warn("DB startup background notice:", err.message);
});

export async function checkDatabaseHealth() {
    try {
        if (databaseEngine === "neon-serverless-prisma" || databaseEngine === "postgresql-prisma") {
            const start = Date.now();
            await prismaInstance.$queryRaw`SELECT 1 as connected`;
            const latencyMs = Date.now() - start;
            return {
                status: "connected",
                engine: databaseEngine === "neon-serverless-prisma" ? "Neon Serverless Database (PostgreSQL)" : "PostgreSQL (Prisma)",
                urlConfigured: true,
                latencyMs,
                healthy: true,
            };
        }
        return {
            status: "active (development / seed mode)",
            engine: "In-Memory Seed Database (Fast Development)",
            urlConfigured: Boolean(process.env.DATABASE_URL),
            error: dbConnectionError,
            healthy: true,
            counts: {
                users: store.users.length,
                workspaces: store.workspaces.length,
                projects: store.projects.length,
                tasks: store.tasks.length,
                comments: store.comments.length,
            },
        };
    } catch (err) {
        return {
            status: "degraded",
            engine: databaseEngine,
            healthy: false,
            error: err.message,
        };
    }
}

// Proxy getter so prisma is always dynamically resolved to the active instance
const prisma = new Proxy({}, {
    get(target, prop) {
        return prismaInstance[prop];
    }
});

export default prisma;

