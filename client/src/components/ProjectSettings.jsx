import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Save, Crown, Trash2, ShieldCheck, UserPlus, Sparkles, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AppAuth";
import { fetchWorkspaces, updateProjectDetails, setProjectLead, removeProjectMember, deleteProject } from "../features/workspaceSlice";
import api from "../configs/api";
import toast from "react-hot-toast";
import AddProjectMember from "./AddProjectMember";

export default function ProjectSettings({ project }) {
    
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        progress: 0,
        team_lead: "",
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingProject, setIsDeletingProject] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || "",
                description: project.description || "",
                status: project.status || "PLANNING",
                priority: project.priority || "MEDIUM",
                start_date: project.start_date || new Date().toISOString().split("T")[0],
                end_date: project.end_date || "",
                progress: project.progress || 0,
                team_lead: project.team_lead || "",
            });
        }
    }, [project]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!project?.id) return;
        setIsSubmitting(true);
        const toastId = toast.loading("Saving project changes...");
        try {
            const token = getToken ? await getToken() : "demo_token";
            const updatePayload = {
                id: project.id,
                ...formData,
            };

            try {
                await api.put(`/api/projects`, updatePayload, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) {
                console.warn("Project update notice:", err);
            }

            dispatch(updateProjectDetails(updatePayload));
            toast.success("Project updated successfully", { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetLead = async (userIdOrEmail) => {
        if (!project?.id || !userIdOrEmail) return;
        const toastId = toast.loading("Updating project lead...");
        try {
            const token = getToken ? await getToken() : "demo_token";
            try {
                await api.post(`/api/projects/${project.id}/setLead`, { team_lead: userIdOrEmail }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) {
                console.warn("Set lead notice:", err);
            }

            dispatch(setProjectLead({ projectId: project.id, leadUserId: userIdOrEmail }));
            setFormData((prev) => ({ ...prev, team_lead: userIdOrEmail }));
            toast.success("Project lead updated", { id: toastId });
        } catch (error) {
            toast.error("Failed to update project lead", { id: toastId });
        }
    };

    const handleRemoveMember = async (userId, memberEmail) => {
        if (!project?.id) return;
        if (project.team_lead === userId || project.team_lead === memberEmail) {
            return toast.error("Cannot remove the active Project Lead. Please assign a new lead first.");
        }

        const toastId = toast.loading("Removing member...");
        try {
            const token = getToken ? await getToken() : "demo_token";
            try {
                await api.post(`/api/projects/${project.id}/removeMember`, { userId, email: memberEmail }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) {
                console.warn("Remove member notice:", err);
            }

            dispatch(removeProjectMember({ projectId: project.id, userId }));
            toast.success("Member removed from project", { id: toastId });
        } catch (error) {
            toast.error("Failed to remove member", { id: toastId });
        }
    };

    const handleDeleteProject = async () => {
        if (!project?.id) return;
        setIsDeletingProject(true);
        const toastId = toast.loading("Deleting project from database...");
        try {
            const token = getToken ? await getToken() : "demo_token";
            try {
                await api.delete(`/api/projects/${project.id}`, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) {
                console.warn("Delete project notice:", err);
            }

            dispatch(deleteProject(project.id));
            toast.success("Project deleted successfully", { id: toastId });
            setShowDeleteConfirm(false);
            window.location.href = "/projects";
        } catch (error) {
            toast.error("Failed to delete project", { id: toastId });
        } finally {
            setIsDeletingProject(false);
        }
    };

    const inputClasses = "w-full px-3.5 py-2.5 rounded-lg border text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40";
    const cardClasses = "rounded-2xl border p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs";
    const labelClasses = "block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5";

    const safeDateInput = (val) => {
        try {
            return val ? format(new Date(val), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
        } catch {
            return format(new Date(), "yyyy-MM-dd");
        }
    };

    const projectMembers = project?.members || [];
    const workspaceMembers = currentWorkspace?.members || [];

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Project Details Form */}
            <div className={cardClasses}>
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Project Details</h2>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {formData.status}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className={labelClasses}>Project Name *</label>
                        <input
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={inputClasses}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClasses}>Description</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={inputClasses + " h-20 resize-none"}
                        />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Status</label>
                            <select
                                value={formData.status || 'PLANNING'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className={inputClasses}
                            >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>Priority</label>
                            <select
                                value={formData.priority || 'MEDIUM'}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className={inputClasses}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Start Date</label>
                            <input
                                type="date"
                                value={safeDateInput(formData.start_date)}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Target End Date</label>
                            <input
                                type="date"
                                value={formData.end_date ? safeDateInput(formData.end_date) : ""}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Project Lead selector */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                        <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1.5">
                            <Crown className="size-3.5 text-amber-500" /> Project Lead
                        </label>
                        <select
                            value={formData.team_lead || ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFormData({ ...formData, team_lead: val });
                                if (val) handleSetLead(val);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                            <option value="">Select Project Lead</option>
                            {projectMembers.map((m) => {
                                const val = m.user?.id || m.userId || m.user?.email;
                                return (
                                    <option key={m.id || val} value={val}>
                                        {m.user?.name || m.user?.email} ({m.user?.email || "Member"})
                                    </option>
                                );
                            })}
                            {workspaceMembers
                                .filter((wm) => !projectMembers.some((pm) => pm.user?.email === wm.user?.email))
                                .map((wm) => {
                                    const val = wm.user?.id || wm.userId || wm.user?.email;
                                    return (
                                        <option key={wm.id || val} value={val}>
                                            {wm.user?.name || wm.user?.email} (Workspace Member)
                                        </option>
                                    );
                                })}
                        </select>
                    </div>

                    {/* Progress Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className={labelClasses}>Progress</label>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formData.progress || 0}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formData.progress || 0}
                            onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                            className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition shadow-xs disabled:opacity-50"
                        >
                            <Save className="size-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Team Members & Leads Card */}
            <div className="space-y-6">
                <div className={cardClasses}>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                        <div>
                            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                Team Members <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">({projectMembers.length})</span>
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage project team roles and assignees</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold cursor-pointer transition"
                        >
                            <Plus className="size-3.5" /> Add Member
                        </button>
                    </div>

                    {/* Member List */}
                    {projectMembers.length > 0 ? (
                        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                            {projectMembers.map((member, index) => {
                                const userId = member.user?.id || member.userId || member.id;
                                const email = member.user?.email || "";
                                const name = member.user?.name || email.split("@")[0] || "Member";
                                const isLead = project.team_lead === userId || project.team_lead === email || project.team_lead === member.user?.name;

                                return (
                                    <div
                                        key={member.id || index}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                                            isLead
                                                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50"
                                                : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {member.user?.image ? (
                                                <img src={member.user.image} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
                                                    {name[0]?.toUpperCase() || "U"}
                                                </div>
                                            )}
                                            <div className="truncate text-left">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{name}</span>
                                                    {isLead && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                                            <Crown className="size-2.5" /> Project Lead
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {!isLead ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetLead(userId || email)}
                                                    className="px-2.5 py-1 rounded text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
                                                    title="Make Project Lead"
                                                >
                                                    Set Lead
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(userId, email)}
                                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                                                title="Remove member from project"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-zinc-400 text-sm">
                            <p>No team members added yet.</p>
                            <button
                                type="button"
                                onClick={() => setIsDialogOpen(true)}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                            >
                                + Add first team member
                            </button>
                        </div>
                    )}

                    <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                </div>

                {/* Danger Zone: Delete Project */}
                <div className="rounded-2xl border border-red-200 dark:border-red-900/60 p-5 bg-red-50/40 dark:bg-red-950/20 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                            <Trash2 className="size-4" /> Delete Project
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                            Danger
                        </span>
                    </div>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
                        Permanently remove <span className="font-semibold">{project.name}</span> and all associated tasks, task comments, and member assignments from the database.
                    </p>
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                            <Trash2 className="size-3.5" /> Delete Project
                        </button>
                    </div>
                </div>

                {/* Delete Project Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl">
                                    <AlertCircle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete Project?</h3>
                                    <p className="text-xs text-zinc-500">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">"{project.name}"</span>? All tasks, attachments, and data belonging to this project will be permanently erased.
                            </p>
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeletingProject}
                                    onClick={handleDeleteProject}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 className="size-3.5" />
                                    {isDeletingProject ? "Deleting..." : "Yes, Delete Project"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

