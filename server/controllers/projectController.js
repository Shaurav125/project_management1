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
        const { id, workspaceId, description, name, status, start_date, end_date, progress, priority, team_lead } = req.body;

        const existingProject = await prisma.project.findUnique({
            where: { id }
        });

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        const targetWorkspaceId = workspaceId || existingProject.workspaceId;

        let teamLeadId = existingProject.team_lead;
        if (team_lead) {
            // Check if team_lead is email or id
            if (team_lead.includes("@")) {
                const u = await prisma.user.findUnique({ where: { email: team_lead } });
                if (u) teamLeadId = u.id;
            } else {
                teamLeadId = team_lead;
            }
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId: targetWorkspaceId,
                description: description !== undefined ? description : existingProject.description,
                name: name !== undefined ? name : existingProject.name,
                status: status || existingProject.status,
                priority: priority || existingProject.priority,
                progress: progress !== undefined ? Number(progress) : existingProject.progress,
                team_lead: teamLeadId,
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
                    name: email.split('@')[0].replace(/[\._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                    email,
                    image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(email)}`,
                }
            });
        }

        const member = await prisma.projectMember.create({
            data: {
                userId: user.id,
                projectId,
            },
        });

        res.json({
            member: {
                ...member,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                }
            },
            message: "Member added to project successfully"
        });
    } catch (error) {
        console.error("addMember error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Remove Member from Project
export const removeMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { memberUserId, email } = req.body;

        let targetUserId = memberUserId;
        if (!targetUserId && email) {
            const u = await prisma.user.findUnique({ where: { email } });
            if (u) targetUserId = u.id;
        }

        if (!targetUserId) {
            return res.status(400).json({ message: "Member identifier is required" });
        }

        if (prisma.projectMember.deleteMany) {
            await prisma.projectMember.deleteMany({
                where: {
                    projectId,
                    userId: targetUserId,
                }
            });
        }

        res.json({ message: "Member removed from project successfully" });
    } catch (error) {
        console.error("removeMember error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Set Project Lead
export const setProjectLead = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { leadUserId, leadEmail } = req.body;

        let targetLeadId = leadUserId;
        if (!targetLeadId && leadEmail) {
            let u = await prisma.user.findUnique({ where: { email: leadEmail } });
            if (!u) {
                u = await prisma.user.create({
                    data: {
                        name: leadEmail.split('@')[0],
                        email: leadEmail,
                        image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(leadEmail)}`,
                    }
                });
            }
            targetLeadId = u.id;
        }

        if (!targetLeadId) {
            return res.status(400).json({ message: "Lead identifier is required" });
        }

        // Ensure lead is also a project member
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isMember = project.members?.some(m => m.userId === targetLeadId);
        if (!isMember) {
            await prisma.projectMember.create({
                data: {
                    userId: targetLeadId,
                    projectId,
                }
            });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { team_lead: targetLeadId }
        });

        res.json({ project: updatedProject, message: "Project lead updated successfully" });
    } catch (error) {
        console.error("setProjectLead error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete Project
export const deleteProject = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const projectId = req.params.projectId || req.params.id || req.body.projectId || req.body.id;

        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: true,
                members: true,
                workspace: true,
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const taskIds = project.tasks?.map(t => t.id) || [];

        // Delete comments on project tasks
        if (taskIds.length > 0) {
            await prisma.comment.deleteMany({
                where: { taskId: { in: taskIds } }
            }).catch(e => console.warn("Comments deletion notice:", e.message));

            await prisma.task.deleteMany({
                where: { id: { in: taskIds } }
            }).catch(e => console.warn("Tasks deletion notice:", e.message));
        }

        // Delete project members
        await prisma.projectMember.deleteMany({
            where: { projectId: project.id }
        }).catch(e => console.warn("Project members deletion notice:", e.message));

        // Delete the project
        await prisma.project.delete({
            where: { id: project.id }
        });

        res.json({
            success: true,
            message: "Project and all associated tasks deleted successfully",
            deletedId: projectId
        });
    } catch (error) {
        console.error("deleteProject error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};
