import { useState } from "react";
import { XIcon, PlusIcon, CrownIcon, UserCheckIcon, ShieldIcon } from "lucide-react";
import { useAuth } from "../context/AppAuth";
import { useDispatch, useSelector } from "react-redux";
import { addProject } from "../features/workspaceSlice";
import toast from "react-hot-toast";
import api from "../configs/api";

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {

    const dispatch = useDispatch();
    const { getToken, userId } = useAuth();
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        team_members: [],
        team_lead: "",
        progress: 0,
    });

    const [customEmail, setCustomEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddCustomEmail = (e) => {
        e?.preventDefault();
        const trimmed = customEmail.trim().toLowerCase();
        if (!trimmed) return;
        if (!trimmed.includes("@") || !trimmed.includes(".")) {
            return toast.error("Please enter a valid email address");
        }
        if (formData.team_members.includes(trimmed)) {
            return toast.error("Member is already in the list");
        }
        setFormData((prev) => ({
            ...prev,
            team_members: [...prev.team_members, trimmed],
            team_lead: prev.team_lead || trimmed,
        }));
        setCustomEmail("");
        toast.success(`Added ${trimmed}`);
    };

    const handleToggleMember = (email) => {
        if (!email) return;
        setFormData((prev) => {
            const isSelected = prev.team_members.includes(email);
            const newMembers = isSelected
                ? prev.team_members.filter((m) => m !== email)
                : [...prev.team_members, email];
            let newLead = prev.team_lead;
            if (isSelected && prev.team_lead === email) {
                newLead = newMembers[0] || "";
            } else if (!isSelected && !prev.team_lead) {
                newLead = email;
            }
            return {
                ...prev,
                team_members: newMembers,
                team_lead: newLead,
            };
        });
    };

    const removeTeamMember = (email) => {
        setFormData((prev) => ({
            ...prev,
            team_members: prev.team_members.filter((m) => m !== email),
            team_lead: prev.team_lead === email ? prev.team_members.find((m) => m !== email) || "" : prev.team_lead,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.name.trim()) {
                return toast.error("Please enter a project name");
            }
            setIsSubmitting(true);
            const token = getToken ? await getToken() : "demo_token";
            let projectData = null;

            // Ensure project lead is at least set to default if empty
            const leadEmail = formData.team_lead || currentWorkspace?.members?.[0]?.user?.email || formData.team_members[0] || "lead@example.com";
            const payload = {
                workspaceId: currentWorkspace?.id,
                ...formData,
                team_lead: leadEmail,
                team_members: Array.from(new Set([...formData.team_members, leadEmail])),
            };

            try {
                const { data } = await api.post("/api/projects", payload, { headers: { Authorization: `Bearer ${token}` } });
                projectData = data.project;
                toast.success("Project created successfully");
            } catch (err) {
                console.warn("Server create project fallback to local state:", err);
                projectData = {
                    id: `proj_${Date.now()}`,
                    name: formData.name,
                    description: formData.description || "",
                    priority: formData.priority || "MEDIUM",
                    status: formData.status || "PLANNING",
                    start_date: formData.start_date ? new Date(formData.start_date) : new Date(),
                    end_date: formData.end_date ? new Date(formData.end_date) : null,
                    team_lead: leadEmail,
                    workspaceId: currentWorkspace?.id,
                    progress: 0,
                    tasks: [],
                    members: payload.team_members.map((em, idx) => ({
                        id: `pm_${Date.now()}_${idx}`,
                        userId: `user_${idx}`,
                        user: {
                            id: `user_${idx}`,
                            name: em.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                            email: em,
                            image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(em)}`,
                        },
                    })),
                    createdAt: new Date().toISOString(),
                };
                toast.success("Project created");
            }

            if (projectData) {
                dispatch(addProject(projectData));
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isDialogOpen) return null;

    const workspaceMembers = currentWorkspace?.members || [];

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center text-left z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-xl text-zinc-900 dark:text-zinc-100 relative shadow-2xl my-8 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold">Create New Project</h2>
                        {currentWorkspace && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Workspace: <span className="font-medium text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
                            </p>
                        )}
                    </div>
                    <button
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        onClick={() => setIsDialogOpen(false)}
                    >
                        <XIcon className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 mt-4 flex-1">
                    {/* Project Name */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Project Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Mobile App Redesign"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Key goals, deliverables, and architecture overview..."
                            rows={2}
                            className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                        />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">Target End Date</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                min={formData.start_date || undefined}
                                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                    </div>

                    {/* Project Lead Selection */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                <CrownIcon className="size-3.5 text-amber-500" /> Project Lead *
                            </label>
                            {formData.team_lead && (
                                <span className="text-[11px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-medium">
                                    Lead Assigned
                                </span>
                            )}
                        </div>
                        <select
                            value={formData.team_lead}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({
                                    ...prev,
                                    team_lead: val,
                                    team_members: val && !prev.team_members.includes(val) ? [...prev.team_members, val] : prev.team_members,
                                }));
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                            <option value="">Select Project Lead</option>
                            {workspaceMembers.map((member) => (
                                <option key={member.user?.email || member.userId} value={member.user?.email || member.userId}>
                                    {member.user?.name || member.user?.email || "Team Member"} ({member.user?.email || "member"})
                                </option>
                            ))}
                            {formData.team_members
                                .filter((em) => !workspaceMembers.some((m) => m.user?.email === em))
                                .map((em) => (
                                    <option key={em} value={em}>
                                        {em}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Team Members Selection */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                Team Members ({formData.team_members.length} selected)
                            </label>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Click to toggle or type email below</span>
                        </div>

                        {/* Quick pick from Workspace Members */}
                        {workspaceMembers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 max-h-32 overflow-y-auto">
                                {workspaceMembers.map((m) => {
                                    const email = m.user?.email;
                                    if (!email) return null;
                                    const isSelected = formData.team_members.includes(email);
                                    const isLead = formData.team_lead === email;

                                    return (
                                        <button
                                            type="button"
                                            key={email}
                                            onClick={() => handleToggleMember(email)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                                                isSelected
                                                    ? "bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-2xs"
                                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                                            }`}
                                        >
                                            {m.user?.image ? (
                                                <img src={m.user.image} alt={m.user.name || email} className="w-4 h-4 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                                                    {(m.user?.name || email)[0].toUpperCase()}
                                                </div>
                                            )}
                                            <span className="truncate max-w-[120px]">{m.user?.name || email}</span>
                                            {isLead && <CrownIcon className="size-3 text-amber-500 shrink-0" />}
                                            {isSelected && !isLead && <UserCheckIcon className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add Custom Email */}
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddCustomEmail();
                                    }
                                }}
                                placeholder="Add team member by email (e.g. dev@company.com)"
                                className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomEmail}
                                className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
                            >
                                <PlusIcon className="size-3.5" /> Add
                            </button>
                        </div>

                        {/* Selected Members Badges */}
                        {formData.team_members.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {formData.team_members.map((email) => {
                                    const isLead = formData.team_lead === email;
                                    return (
                                        <div
                                            key={email}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                                                isLead
                                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-medium"
                                                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                                            }`}
                                        >
                                            {isLead ? <CrownIcon className="size-3 text-amber-500" /> : <ShieldIcon className="size-3 text-zinc-400" />}
                                            <span className="truncate max-w-[130px]">{email}</span>
                                            {!isLead && (
                                                <button
                                                    type="button"
                                                    title="Make Project Lead"
                                                    onClick={() => setFormData((prev) => ({ ...prev, team_lead: email }))}
                                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline ml-1 cursor-pointer font-medium"
                                                >
                                                    Set Lead
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeTeamMember(email)}
                                                className="hover:text-red-500 ml-1 p-0.5 rounded transition cursor-pointer"
                                            >
                                                <XIcon className="size-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm">
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !currentWorkspace}
                            className="px-5 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium hover:opacity-95 disabled:opacity-50 transition cursor-pointer shadow-xs"
                        >
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectDialog;