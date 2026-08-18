import prisma from "../configs/prisma.js";

// Add comment
export const addComment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { content, taskId } = req.body;

        if (!content || !taskId) {
            return res.status(400).json({ message: "Content and taskId are required" });
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isMember = project.team_lead === userId || task.assigneeId === userId || project.members?.some((member) => member.userId === userId || member.user?.id === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this project" });
        }

        const comment = await prisma.comment.create({
            data: { taskId, content, userId },
            include: { user: true }
        });

        res.json({ comment });
    } catch (error) {
        console.error("addComment error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get comments for task
export const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: { user: true }
        });
        res.json({ comments });
    } catch (error) {
        console.error("getTaskComments error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};
