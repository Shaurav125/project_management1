import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

// Create task
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body;
        const origin = req.get('origin') || 'http://localhost:3000';

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

        if (assigneeId && project.members?.length > 0 && !project.members.some((member) => member.userId === assigneeId || member.user?.id === assigneeId)) {
            // Auto add or allow assignment
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                type: type || "TASK",
                priority: priority || "MEDIUM",
                assigneeId: assigneeId || userId,
                status: status || "TODO",
                due_date: due_date ? new Date(due_date) : new Date(),
            }
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true },
        });

        try {
            await inngest.send({
                name: "app/task.assigned",
                data: {
                    taskId: task.id, origin
                }
            });
        } catch (inngestErr) {
            console.log("Inngest notification skipped:", inngestErr.message);
        }

        res.json({ task: taskWithAssignee, message: "Task created successfully" });
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
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const { userId } = await req.auth();

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

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body,
        });

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
