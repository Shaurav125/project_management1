import prisma from "../configs/prisma.js";

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth();

        let workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        // Auto-seed initial workspace and sample project if new user
        if (!workspaces || workspaces.length === 0) {
            try {
                await prisma.user.upsert({
                    where: { id: userId },
                    update: {},
                    create: {
                        id: userId,
                        name: "Alex Smith",
                        email: "alexsmith@example.com",
                        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"
                    }
                });

                const newWorkspace = await prisma.workspace.create({
                    data: {
                        id: `ws_${Date.now()}`,
                        name: "Engineering & Product",
                        slug: `engineering-product-${Date.now()}`,
                        description: "Main workspace for product roadmap, sprints, and task management.",
                        ownerId: userId,
                        image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
                        members: {
                            create: {
                                userId: userId,
                                role: "ADMIN"
                            }
                        },
                        projects: {
                            create: {
                                name: "LaunchPad CRM",
                                description: "Next-gen CRM platform for lead tracking and automation",
                                status: "ACTIVE",
                                priority: "HIGH",
                                progress: 65,
                                team_lead: userId,
                                members: {
                                    create: {
                                        userId: userId
                                    }
                                },
                                tasks: {
                                    create: [
                                        {
                                            title: "Implement biometric authentication",
                                            description: "Integrate FaceID and TouchID login with fallback passcode flow",
                                            status: "IN_PROGRESS",
                                            type: "FEATURE",
                                            priority: "HIGH",
                                            assigneeId: userId,
                                            due_date: new Date(Date.now() + 86400000 * 5)
                                        },
                                        {
                                            title: "Fix notification badge sync",
                                            description: "Ensure unread count updates correctly after background app refresh",
                                            status: "TODO",
                                            type: "BUG",
                                            priority: "MEDIUM",
                                            assigneeId: userId,
                                            due_date: new Date(Date.now() + 86400000 * 3)
                                        },
                                        {
                                            title: "Startup rendering optimization",
                                            description: "Profile and eliminate redundant bundle evaluation on startup",
                                            status: "DONE",
                                            type: "IMPROVEMENT",
                                            priority: "LOW",
                                            assigneeId: userId,
                                            due_date: new Date(Date.now() - 86400000)
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    include: {
                        members: { include: { user: true } },
                        projects: {
                            include: {
                                tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                                members: { include: { user: true } }
                            }
                        },
                        owner: true
                    }
                });

                workspaces = [newWorkspace];
            } catch (seedErr) {
                console.warn("Auto-initialization note:", seedErr.message);
            }
        }

        res.json({ workspaces });
    } catch (error) {
        console.error("getUserWorkspaces error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add / Invite member to workspace
export const addWorkspaceMember = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const workspaceId = req.params.workspaceId || req.body.workspaceId;
        const { email, role, name } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } },
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            const displayName = name || email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            user = await prisma.user.create({
                data: {
                    id: `user_${Date.now()}`,
                    name: displayName,
                    email: email.toLowerCase(),
                    image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(email)}`,
                }
            });
        }

        const isAlreadyMember = workspace.members?.some(m => m.userId === user.id || m.user?.email?.toLowerCase() === email.toLowerCase());
        if (isAlreadyMember) {
            return res.status(400).json({ message: "User is already a member of this workspace" });
        }

        const assignedRole = role === "org:admin" || role === "ADMIN" ? "ADMIN" : "MEMBER";
        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspace.id,
                role: assignedRole,
            }
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
            message: "Team member added to workspace successfully"
        });
    } catch (error) {
        console.error("addWorkspaceMember error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Create workspace
export const createWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { name, description, image_url } = req.body;
        const slug = `${(name || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

        // Ensure user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                name: "Workspace Owner",
                email: `${userId}@example.com`,
                image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
            }
        });

        const workspace = await prisma.workspace.create({
            data: {
                id: `ws_${Date.now()}`,
                name: name || "New Workspace",
                slug,
                description: description || "",
                image_url: image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
                ownerId: userId,
                members: {
                    create: {
                        userId,
                        role: "ADMIN"
                    }
                }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        res.json({ workspace, message: "Workspace created successfully" });
    } catch (error) {
        console.error("createWorkspace error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update workspace
export const updateWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const workspaceId = req.params.workspaceId || req.params.id || req.body.id || req.body.workspaceId;
        const { name, description, image_url, slug } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const updated = await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                name: name !== undefined ? name : workspace.name,
                description: description !== undefined ? description : workspace.description,
                image_url: image_url !== undefined ? image_url : workspace.image_url,
                slug: slug !== undefined ? slug : workspace.slug,
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        res.json({ workspace: updated, message: "Workspace updated successfully" });
    } catch (error) {
        console.error("updateWorkspace error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete workspace
export const deleteWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId || req.body.id;

        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace ID is required" });
        }

        const workspace = await prisma.workspace.findFirst({
            where: {
                OR: [
                    { id: workspaceId },
                    { slug: workspaceId },
                ]
            },
            include: {
                members: true,
                projects: {
                    include: { tasks: true }
                }
            }
        });

        if (!workspace) {
            return res.json({
                success: true,
                message: "Workspace removed",
                deletedId: workspaceId
            });
        }

        // Clean up tasks and comments
        const projectIds = workspace.projects?.map(p => p.id) || [];
        const taskIds = workspace.projects?.flatMap(p => p.tasks?.map(t => t.id) || []) || [];

        if (taskIds.length > 0) {
            await prisma.comment.deleteMany({
                where: { taskId: { in: taskIds } }
            }).catch(e => console.warn("Comments cleanup note:", e.message));

            await prisma.task.deleteMany({
                where: { id: { in: taskIds } }
            }).catch(e => console.warn("Tasks cleanup note:", e.message));
        }

        if (projectIds.length > 0) {
            await prisma.projectMember.deleteMany({
                where: { projectId: { in: projectIds } }
            }).catch(e => console.warn("Project members cleanup note:", e.message));

            await prisma.project.deleteMany({
                where: { id: { in: projectIds } }
            }).catch(e => console.warn("Projects cleanup note:", e.message));
        }

        await prisma.workspaceMember.deleteMany({
            where: { workspaceId: workspace.id }
        }).catch(e => console.warn("Workspace members cleanup note:", e.message));

        await prisma.workspace.delete({
            where: { id: workspace.id }
        }).catch(e => console.warn("Workspace delete note:", e.message));

        res.json({
            success: true,
            message: "Workspace and all related data deleted from database successfully",
            deletedId: workspace.id
        });
    } catch (error) {
        console.error("deleteWorkspace error:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};