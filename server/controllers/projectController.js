import prisma from "../configs/prisma.js";
import { sendProjectInviteEmail } from "../configs/nodemailer.js";

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

        // Dispatch Project Invite Email
        const origin = req.get('origin') || process.env.VITE_BASEURL || 'http://localhost:3000';
        try {
            await sendProjectInviteEmail({
                memberEmail: user.email,
                memberName: user.name,
                projectName: project.name,
                projectUrl: `${origin}/projectsDetail?id=${projectId}`,
            });
        } catch (mailErr) {
            console.warn("Project invite email notice:", mailErr.message);
        }

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
        const { memberUserId, userId: bodyUserId, email, memberEmail } = req.body;

        const targetEmail = email || memberEmail;
        let targetUserId = memberUserId || bodyUserId;
        if (!targetUserId && targetEmail) {
            const u = await prisma.user.findUnique({ where: { email: targetEmail } });
            if (u) targetUserId = u.id;
        }

        if (!targetUserId && !targetEmail) {
            return res.status(400).json({ message: "Member identifier is required" });
        }

        // Check if this project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // If the removed member was the active team lead, clear the lead
        const isCurrentLead = (targetUserId && project.team_lead === targetUserId) ||
                              (targetEmail && (project.team_lead === targetEmail || project.members.some(m => m.user?.email === targetEmail && m.userId === project.team_lead)));
        
        if (isCurrentLead) {
            await prisma.project.update({
                where: { id: projectId },
                data: { team_lead: null }
            }).catch(e => console.warn("Project lead clear notice:", e.message));
        }

        // Unassign any tasks in this project assigned to this user
        if (targetUserId) {
            await prisma.task.updateMany({
                where: {
                    projectId,
                    assigneeId: targetUserId
                },
                data: {
                    assigneeId: null
                }
            }).catch(e => console.warn("Task unassign notice:", e.message));
        }

        // Delete from ProjectMember relation
        if (prisma.projectMember?.deleteMany) {
            await prisma.projectMember.deleteMany({
                where: {
                    projectId,
                    ...(targetUserId ? { userId: targetUserId } : {})
                }
            }).catch(e => console.warn("ProjectMember delete notice:", e.message));
        }

        res.json({
            success: true,
            message: "Member removed from project and tasks unassigned successfully",
            removedUserId: targetUserId,
            clearedLead: isCurrentLead
        });
    } catch (error) {
        console.error("removeMember error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Set or Clear Project Lead
export const setProjectLead = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { leadUserId, leadEmail, team_lead, userId: bodyUserId, email } = req.body;

        const rawLead = leadUserId || team_lead || bodyUserId || leadEmail || email;

        // If explicitly set to empty/none/null, clear the lead
        if (!rawLead || rawLead === "none" || rawLead === "unassigned") {
            const updatedProject = await prisma.project.update({
                where: { id: projectId },
                data: { team_lead: null }
            });
            return res.json({ project: updatedProject, message: "Project lead cleared successfully" });
        }

        let targetLeadId = rawLead;
        if (rawLead.includes("@")) {
            let u = await prisma.user.findUnique({ where: { email: rawLead } });
            if (!u) {
                u = await prisma.user.create({
                    data: {
                        name: rawLead.split('@')[0].replace(/[\._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                        email: rawLead,
                        image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(rawLead)}`,
                    }
                });
            }
            targetLeadId = u.id;
        }

        // Ensure lead is in project members
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isMember = project.members?.some(m => m.userId === targetLeadId);
        if (!isMember && prisma.projectMember?.create) {
            await prisma.projectMember.create({
                data: {
                    userId: targetLeadId,
                    projectId,
                }
            }).catch(e => console.warn("Auto-add lead to members notice:", e.message));
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
        const projectId = req.params.projectId || req.params.id || req.body?.projectId || req.body?.id;

        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }

        // 1. Find all tasks for this project to clean up their comments
        let taskIds = [];
        try {
            const projectTasks = await prisma.task.findMany({
                where: { projectId },
                select: { id: true }
            });
            taskIds = projectTasks.map(t => t.id);
        } catch (e) {
            console.warn("Fetch tasks notice during project delete:", e.message);
        }

        // 2. Delete all comments on tasks belonging to this project
        if (taskIds.length > 0) {
            await prisma.comment.deleteMany({
                where: { taskId: { in: taskIds } }
            }).catch(e => console.warn("Comments deletion notice:", e.message));
        }

        // 3. Delete all tasks belonging to this project
        await prisma.task.deleteMany({
            where: { projectId }
        }).catch(e => console.warn("Tasks deletion notice:", e.message));

        // 4. Delete all project members for this project
        await prisma.projectMember.deleteMany({
            where: { projectId }
        }).catch(e => console.warn("Project members deletion notice:", e.message));

        // 5. Delete the project itself from PostgreSQL database
        const deleteResult = await prisma.project.deleteMany({
            where: { id: projectId }
        });

        res.json({
            success: true,
            message: "Project and all associated data permanently deleted from database",
            deletedId: projectId,
            count: deleteResult.count
        });
    } catch (error) {
        console.error("deleteProject error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};
