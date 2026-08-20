import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";
import { sendTaskAssignmentEmail } from "../configs/nodemailer.js";

// Helper to resolve or create assignee
const resolveAssignee = async (assigneeId, assigneeEmail, projectId, workspaceId) => {
    let user = null;
    const rawTarget = assigneeEmail || assigneeId;

    if (assigneeId) {
        user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: assigneeId },
                    { email: assigneeId }
                ]
            }
        });
    }

    if (!user && rawTarget && (rawTarget.includes("@") || assigneeEmail)) {
        const cleanEmail = (assigneeEmail || assigneeId).trim().toLowerCase();
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: `user_${Date.now()}`,
                    name: cleanEmail.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                    email: cleanEmail,
                    image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(cleanEmail)}`,
                },
            });
        }
    }

    if (user && projectId) {
        // Ensure user is in project members
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true },
        });

        if (project && !project.members.some((m) => m.userId === user.id)) {
            try {
                await prisma.projectMember.create({
                    data: {
                        userId: user.id,
                        projectId,
                    },
                });
            } catch (e) {
                // Ignore if already exists
            }
        }

        // Ensure user is in workspace members
        if (workspaceId || project?.workspaceId) {
            const wsId = workspaceId || project.workspaceId;
            const ws = await prisma.workspace.findUnique({
                where: { id: wsId },
                include: { members: true },
            });
            if (ws && !ws.members.some((m) => m.userId === user.id)) {
                try {
                    await prisma.workspaceMember.create({
                        data: {
                            userId: user.id,
                            workspaceId: wsId,
                            role: "MEMBER",
                        },
                    });
                } catch (e) {
                    // Ignore if already exists
                }
            }
        }
    }

    return user;
};

// Create task
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, workspaceId, title, description, type, status, priority, assigneeId, assigneeEmail, due_date } = req.body;
        const origin = req.get('origin') || process.env.VITE_BASEURL || 'http://localhost:3000';

        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isMember = project.team_lead === userId || project.members?.some((m) => m.userId === userId || m.user?.id === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have privileges for this project" });
        }

        // Resolve assignee if provided
        let targetAssignee = null;
        if (assigneeId || assigneeEmail) {
            targetAssignee = await resolveAssignee(assigneeId, assigneeEmail, projectId, workspaceId || project.workspaceId);
        }

        const finalAssigneeId = targetAssignee ? targetAssignee.id : (assigneeId || userId);

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description: description || "",
                type: type || "TASK",
                priority: priority || "MEDIUM",
                assigneeId: finalAssigneeId,
                status: status || "TODO",
                due_date: due_date ? new Date(due_date) : new Date(),
            }
        });

        const taskWithRelations = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true, project: true },
        });

        // 1. Direct Email Dispatch to Assignee
        if (taskWithRelations?.assignee?.email) {
            const taskUrl = `${origin}/taskDetails?projectId=${projectId}&taskId=${task.id}`;
            try {
                await sendTaskAssignmentEmail({
                    assigneeEmail: taskWithRelations.assignee.email,
                    assigneeName: taskWithRelations.assignee.name || taskWithRelations.assignee.email,
                    taskTitle: task.title,
                    taskDescription: task.description,
                    projectName: project.name,
                    dueDate: task.due_date,
                    priority: task.priority,
                    taskUrl,
                });
            } catch (mailErr) {
                console.warn("Direct task assignment email warning:", mailErr.message);
            }
        }

        // 2. Inngest background event
        try {
            await inngest.send({
                name: "app/task.assigned",
                data: {
                    taskId: task.id,
                    origin
                }
            });
        } catch (inngestErr) {
            console.log("Inngest notification skipped:", inngestErr.message);
        }

        res.json({ task: taskWithRelations, message: "Task created successfully" });
    } catch (error) {
        console.error("createTask error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: { assignee: true, project: true }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const { userId } = await req.auth();
        const origin = req.get('origin') || process.env.VITE_BASEURL || 'http://localhost:3000';

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isMember = project.team_lead === userId || task.assigneeId === userId || project.members?.some((m) => m.userId === userId || m.user?.id === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You don't have privileges to update this task" });
        }

        const updateData = { ...req.body };
        let newAssigneeUser = null;

        // If assignee is changing or specified by email/id
        if (updateData.assigneeId || updateData.assigneeEmail) {
            newAssigneeUser = await resolveAssignee(updateData.assigneeId, updateData.assigneeEmail, task.projectId, project.workspaceId);
            if (newAssigneeUser) {
                updateData.assigneeId = newAssigneeUser.id;
            }
            delete updateData.assigneeEmail;
        }

        if (updateData.due_date) {
            updateData.due_date = new Date(updateData.due_date);
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData,
            include: { assignee: true, project: true, comments: { include: { user: true } } },
        });

        // If assignee was updated and differs from previous, send email to new assignee
        if (newAssigneeUser && newAssigneeUser.id !== task.assigneeId && newAssigneeUser.email) {
            const taskUrl = `${origin}/taskDetails?projectId=${task.projectId}&taskId=${updatedTask.id}`;
            try {
                await sendTaskAssignmentEmail({
                    assigneeEmail: newAssigneeUser.email,
                    assigneeName: newAssigneeUser.name || newAssigneeUser.email,
                    taskTitle: updatedTask.title,
                    taskDescription: updatedTask.description,
                    projectName: project.name,
                    dueDate: updatedTask.due_date,
                    priority: updatedTask.priority,
                    taskUrl,
                });
            } catch (mailErr) {
                console.warn("Update task assignment email notice:", mailErr.message);
            }
        }

        res.json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        console.error("updateTask error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const singleId = req.params?.id || req.body?.taskId || req.body?.id;
        const tasksIds = req.body?.tasksIds || (singleId ? [singleId] : []);

        if (!tasksIds || !Array.isArray(tasksIds) || tasksIds.length === 0) {
            return res.status(400).json({ message: "No task IDs provided" });
        }

        // Clean up any comments first
        try {
            await prisma.comment.deleteMany({
                where: { taskId: { in: tasksIds } },
            });
        } catch (commErr) {
            console.warn("Comments cleanup notice:", commErr?.message);
        }

        // Delete from database
        const deleteResult = await prisma.task.deleteMany({
            where: { id: { in: tasksIds } },
        });

        res.json({
            message: tasksIds.length === 1 ? "Task deleted successfully" : "Tasks deleted successfully",
            deletedIds: tasksIds,
            count: deleteResult?.count || tasksIds.length,
        });
    } catch (error) {
        console.error("deleteTask error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

