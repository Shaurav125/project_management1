import prisma from "../configs/prisma.js";

// Create project
export const createProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { workspaceId, description, name, status, start_date, end_date, team_members, team_lead, progress, priority } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isWorkspaceAdmin = workspace.ownerId === userId || workspace.members.some((member) => member.userId === userId && member.role === "ADMIN");
        if (!isWorkspaceAdmin && workspace.members.some(m => m.userId === userId)) {
            // Allow members to create projects
        } else if (!isWorkspaceAdmin && workspace.members.length > 0 && !workspace.members.some(m => m.userId === userId)) {
            return res.status(403).json({ message: "You don't have permission to create projects in this workspace" });
        }

        let teamLead = null;
        if (team_lead) {
            teamLead = await prisma.user.findUnique({
                where: { email: team_lead },
                select: { id: true },
            });
        }
        if (!teamLead) {
            teamLead = { id: userId };
        }

        const project = await prisma.project.create({
            data: {
                workspaceId,
                name: name || "New Project",
                description: description || "",
                status: status || "ACTIVE",
                priority: priority || "MEDIUM",
                progress: Number(progress) || 0,
                team_lead: teamLead.id,
                start_date: start_date ? new Date(start_date) : new Date(),
                end_date: end_date ? new Date(end_date) : null,
            }
        });

        // Add creator as member
        const memberIdsToAdd = new Set([teamLead.id, userId]);

        if (team_members?.length > 0 && workspace.members) {
            workspace.members.forEach(member => {
                if (team_members.includes(member.user?.email)) {
                    memberIdsToAdd.add(member.user.id);
                }
            });
        }

        await prisma.projectMember.createMany({
            data: Array.from(memberIdsToAdd).map(memberId => ({
                projectId: project.id,
                userId: memberId,
            }))
        });

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                members: { include: { user: true } },
                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                owner: true
            }
        });

        res.json({ project: projectWithMembers, message: "Project created successfully" });
    } catch (error) {
        console.error("createProject error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update project
export const updateProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id, workspaceId, description, name, status, start_date, end_date, progress, priority } = req.body;

        const existingProject = await prisma.project.findUnique({
            where: { id }
        });

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        const targetWorkspaceId = workspaceId || existingProject.workspaceId;

        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId: targetWorkspaceId,
                description: description !== undefined ? description : existingProject.description,
                name: name !== undefined ? name : existingProject.name,
                status: status || existingProject.status,
                priority: priority || existingProject.priority,
                progress: progress !== undefined ? Number(progress) : existingProject.progress,
                start_date: start_date ? new Date(start_date) : existingProject.start_date,
                end_date: end_date ? new Date(end_date) : existingProject.end_date,
            }
        });

        res.json({ project, message: "Project updated successfully" });
    } catch (error) {
        console.error("updateProject error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add Member to Project
export const addMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { email } = req.body;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const existingMember = project.members?.find((member) => member.user?.email === email || member.email === email);
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: email.split('@')[0],
                    email,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                }
            });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId,
            },
        });

        res.json({ member, message: "Member added successfully" });
    } catch (error) {
        console.error("addMember error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};
