import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../configs/api";
import { dummyWorkspaces } from "../assets/assets";

export const fetchWorkspaces = createAsyncThunk("workspace/fetchWorkspaces", async (payload = {}) => {
    try {
        const getToken = payload?.getToken;
        const token = getToken ? await getToken() : "demo_token";
        const { data } = await api.get("/api/workspaces", { headers: { Authorization: `Bearer ${token}` } });
        if (data?.workspaces && Array.isArray(data.workspaces) && data.workspaces.length > 0) {
            return data.workspaces;
        }
        return dummyWorkspaces;
    } catch (error) {
        console.warn("fetchWorkspaces notice:", error?.response?.data?.message || error.message);
        return dummyWorkspaces;
    }
});

const initialWs = dummyWorkspaces;
const initialSavedId = typeof window !== 'undefined' ? localStorage.getItem("currentWorkspaceId") : null;
const initialCurrentWs = (initialSavedId && initialWs.find(w => w.id === initialSavedId)) || initialWs[0];

const initialState = {
    workspaces: initialWs,
    currentWorkspace: initialCurrentWs,
    loading: false,
};

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload || [];
        },
        setCurrentWorkspace: (state, action) => {
            localStorage.setItem("currentWorkspaceId", action.payload);
            const found = state.workspaces.find((w) => w.id === action.payload || w._id === action.payload);
            if (found) {
                state.currentWorkspace = found;
            }
        },
        addWorkspace: (state, action) => {
            if (!action.payload) return;
            state.workspaces.push(action.payload);
            state.currentWorkspace = action.payload;
            localStorage.setItem("currentWorkspaceId", action.payload.id);
        },
        updateWorkspace: (state, action) => {
            if (!action.payload) return;
            state.workspaces = state.workspaces.map((w) =>
                (w.id === action.payload.id || w._id === action.payload.id) ? { ...w, ...action.payload } : w
            );
            if (state.currentWorkspace?.id === action.payload.id || state.currentWorkspace?._id === action.payload.id) {
                state.currentWorkspace = { ...state.currentWorkspace, ...action.payload };
            }
        },
        deleteWorkspace: (state, action) => {
            const targetId = action.payload;
            state.workspaces = state.workspaces.filter((w) => w.id !== targetId && w._id !== targetId);
            if (state.currentWorkspace?.id === targetId || state.currentWorkspace?._id === targetId) {
                state.currentWorkspace = state.workspaces[0] || null;
                if (state.workspaces[0]) {
                    localStorage.setItem("currentWorkspaceId", state.workspaces[0].id);
                }
            }
        },
        addProject: (state, action) => {
            if (!action.payload) return;
            const newProj = { ...action.payload, tasks: action.payload.tasks || [], members: action.payload.members || [] };
            if (!state.currentWorkspace.projects) {
                state.currentWorkspace.projects = [];
            }
            state.currentWorkspace.projects.push(newProj);
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace.id ? { ...w, projects: (w.projects || []).concat(newProj) } : w
            );
        },
        deleteProject: (state, action) => {
            const projectId = action.payload;
            if (!projectId) return;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.filter(p => p.id !== projectId && p._id !== projectId);
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: w.projects ? w.projects.filter(p => p.id !== projectId && p._id !== projectId) : []
            }));
        },
        addTask: (state, action) => {
            if (!action.payload) return;
            const newTask = action.payload;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                    if (p.id === newTask.projectId) {
                        return {
                            ...p,
                            tasks: p.tasks ? [...p.tasks, newTask] : [newTask]
                        };
                    }
                    return p;
                });
            }

            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id ? {
                    ...w,
                    projects: (w.projects || []).map((p) =>
                        p.id === newTask.projectId ? { ...p, tasks: (p.tasks || []).concat(newTask) } : p
                    )
                } : w
            );
        },
        updateTask: (state, action) => {
            if (!action.payload) return;
            const updated = action.payload;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => ({
                    ...p,
                    tasks: (p.tasks || []).map((t) => t.id === updated.id ? { ...t, ...updated } : t)
                }));
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: (w.projects || []).map((p) => ({
                    ...p,
                    tasks: (p.tasks || []).map((t) => t.id === updated.id ? { ...t, ...updated } : t)
                }))
            }));
        },
        deleteTask: (state, action) => {
            const taskIdsToDelete = Array.isArray(action.payload) ? action.payload : [action.payload];
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => ({
                    ...p,
                    tasks: p.tasks ? p.tasks.filter((t) => !taskIdsToDelete.includes(t.id)) : []
                }));
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: w.projects ? w.projects.map((p) => ({
                    ...p,
                    tasks: p.tasks ? p.tasks.filter((t) => !taskIdsToDelete.includes(t.id)) : []
                })) : []
            }));
        },
        updateProjectDetails: (state, action) => {
            if (!action.payload?.id) return;
            const updated = action.payload;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
                    p.id === updated.id ? { ...p, ...updated } : p
                );
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: w.projects ? w.projects.map((p) =>
                    p.id === updated.id ? { ...p, ...updated } : p
                ) : []
            }));
        },
        addWorkspaceMember: (state, action) => {
            if (!action.payload) return;
            const newMember = action.payload;
            if (state.currentWorkspace) {
                const existing = state.currentWorkspace.members || [];
                const exists = existing.some(m => m.userId === newMember.userId || m.user?.email === newMember.user?.email);
                if (!exists) {
                    state.currentWorkspace.members = [...existing, newMember];
                }
            }
            state.workspaces = state.workspaces.map((w) => {
                if (w.id === state.currentWorkspace?.id) {
                    const existing = w.members || [];
                    const exists = existing.some(m => m.userId === newMember.userId || m.user?.email === newMember.user?.email);
                    return exists ? w : { ...w, members: [...existing, newMember] };
                }
                return w;
            });
        },
        addProjectMember: (state, action) => {
            if (!action.payload?.projectId || !action.payload?.member) return;
            const { projectId, member } = action.payload;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                    if (p.id === projectId) {
                        const existing = p.members || [];
                        const exists = existing.some(m => m.userId === member.userId || m.user?.email === member.user?.email);
                        return exists ? p : { ...p, members: [...existing, member] };
                    }
                    return p;
                });
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: w.projects ? w.projects.map((p) => {
                    if (p.id === projectId) {
                        const existing = p.members || [];
                        const exists = existing.some(m => m.userId === member.userId || m.user?.email === member.user?.email);
                        return exists ? p : { ...p, members: [...existing, member] };
                    }
                    return p;
                }) : []
            }));
        },
        removeProjectMember: (state, action) => {
            if (!action.payload?.projectId || !action.payload?.userId) return;
            const { projectId, userId } = action.payload;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                    if (p.id === projectId) {
                        return {
                            ...p,
                            members: (p.members || []).filter(m => m.userId !== userId && m.user?.id !== userId && m.id !== userId)
                        };
                    }
                    return p;
                });
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: w.projects ? w.projects.map((p) => {
                    if (p.id === projectId) {
                        return {
                            ...p,
                            members: (p.members || []).filter(m => m.userId !== userId && m.user?.id !== userId && m.id !== userId)
                        };
                    }
                    return p;
                }) : []
            }));
        },
        setProjectLead: (state, action) => {
            if (!action.payload?.projectId || !action.payload?.leadUserId) return;
            const { projectId, leadUserId } = action.payload;
            if (state.currentWorkspace?.projects) {
                state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                    if (p.id === projectId) {
                        return { ...p, team_lead: leadUserId };
                    }
                    return p;
                });
            }
            state.workspaces = state.workspaces.map((w) => ({
                ...w,
                projects: w.projects ? w.projects.map((p) => {
                    if (p.id === projectId) {
                        return { ...p, team_lead: leadUserId };
                    }
                    return p;
                }) : []
            }));
        }

    },
    extraReducers: (builder) => {
        builder.addCase(fetchWorkspaces.pending, (state) => {
            // keep previous data visible while revalidating in background for fast UX
            if (!state.workspaces || state.workspaces.length === 0) {
                state.loading = true;
            }
        });
        builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
            if (action.payload && action.payload.length > 0) {
                state.workspaces = action.payload;
                const localStorageCurrentWorkspaceId = localStorage.getItem("currentWorkspaceId");
                if (localStorageCurrentWorkspaceId) {
                    const findWorkspace = action.payload.find((w) => w.id === localStorageCurrentWorkspaceId);
                    state.currentWorkspace = findWorkspace || action.payload[0];
                } else {
                    state.currentWorkspace = action.payload[0];
                }
            }
            state.loading = false;
        });
        builder.addCase(fetchWorkspaces.rejected, (state) => {
            state.loading = false;
        });
    }
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    updateProjectDetails,
    addWorkspaceMember,
    addProjectMember,
    removeProjectMember,
    setProjectLead
} = workspaceSlice.actions;
export default workspaceSlice.reducer;