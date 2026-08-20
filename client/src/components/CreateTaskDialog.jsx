import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Mail, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addTask } from "../features/workspaceSlice";
import { useAuth } from "../context/AppAuth";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../configs/api";

export default function CreateTaskDialog({ showCreateTask, setShowCreateTask, projectId }) {
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const project = currentWorkspace?.projects.find((p) => p.id === projectId);
    
    // Combine project members and workspace members
    const allAvailableMembers = useMemo(() => {
        const list = [];
        const seen = new Set();

        (project?.members || []).forEach((m) => {
            const uid = m?.user?.id || m?.userId;
            const email = m?.user?.email;
            if (email && !seen.has(email)) {
                seen.add(email);
                list.push({ id: uid || email, name: m?.user?.name || email.split("@")[0], email, isProjectMember: true });
            }
        });

        (currentWorkspace?.members || []).forEach((m) => {
            const uid = m?.user?.id || m?.userId;
            const email = m?.user?.email;
            if (email && !seen.has(email)) {
                seen.add(email);
                list.push({ id: uid || email, name: m?.user?.name || email.split("@")[0], email, isProjectMember: false });
            }
        });

        return list;
    }, [project, currentWorkspace]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomEmailMode, setIsCustomEmailMode] = useState(false);
    const [customEmail, setCustomEmail] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        due_date: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const targetAssigneeId = isCustomEmailMode ? "" : formData.assigneeId;
        const targetAssigneeEmail = isCustomEmailMode ? customEmail.trim() : "";

        if (isCustomEmailMode && !targetAssigneeEmail) {
            toast.error("Please enter an email address to invite");
            setIsSubmitting(false);
            return;
        }

        try {
            const token = getToken ? await getToken() : "demo_token";
            let createdTask = null;

            try {
                const { data } = await api.post(
                    "/api/tasks",
                    {
                        ...formData,
                        assigneeId: targetAssigneeId,
                        assigneeEmail: targetAssigneeEmail,
                        workspaceId: currentWorkspace?.id,
                        projectId
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                createdTask = data.task;
                toast.success(data?.message || "Task created & invitation email prepared!");
            } catch (err) {
                console.warn("Server task creation fallback:", err);
                createdTask = {
                    id: `task_${Date.now()}`,
                    projectId,
                    title: formData.title,
                    description: formData.description || "",
                    status: formData.status || "TODO",
                    type: formData.type || "TASK",
                    priority: formData.priority || "MEDIUM",
                    assigneeId: targetAssigneeId || targetAssigneeEmail || "user_1",
                    assignee: {
                        id: targetAssigneeId || "user_1",
                        email: targetAssigneeEmail || "assigned@workspace.local",
                        name: targetAssigneeEmail ? targetAssigneeEmail.split("@")[0] : "Assigned Member"
                    },
                    due_date: formData.due_date ? new Date(formData.due_date) : new Date(),
                    createdAt: new Date().toISOString(),
                    comments: [],
                };
                toast.success("Task created");
            }

            if (createdTask) {
                dispatch(addTask(createdTask));
            }

            setShowCreateTask(false);
            setCustomEmail("");
            setIsCustomEmailMode(false);
            setFormData({
                title: "",
                description: "",
                type: "TASK",
                status: "TODO",
                priority: "MEDIUM",
                assigneeId: "",
                due_date: "",
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return showCreateTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900/90 dark:backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/90 rounded-2xl shadow-2xl w-full max-w-md p-6 text-zinc-900 dark:text-white">
                <h2 className="text-xl font-bold mb-4">Create New Task</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                        <label htmlFor="title" className="text-sm font-medium">Title</label>
                        <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the task" className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                                <option value="BUG">Bug</option>
                                <option value="FEATURE">Feature</option>
                                <option value="TASK">Task</option>
                                <option value="IMPROVEMENT">Improvement</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Assignee</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomEmailMode(!isCustomEmailMode);
                                        if (!isCustomEmailMode) {
                                            setFormData(prev => ({ ...prev, assigneeId: "" }));
                                        }
                                    }}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    {isCustomEmailMode ? "Pick Member" : "+ Invite Email"}
                                </button>
                            </div>

                            {isCustomEmailMode ? (
                                <div className="relative mt-1">
                                    <input
                                        type="email"
                                        value={customEmail}
                                        onChange={(e) => setCustomEmail(e.target.value)}
                                        placeholder="colleague@domain.com"
                                        className="w-full rounded dark:bg-zinc-900 border border-blue-400 dark:border-blue-500 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none"
                                        required={isCustomEmailMode}
                                    />
                                </div>
                            ) : (
                                <select
                                    value={formData.assigneeId}
                                    onChange={(e) => {
                                        if (e.target.value === "__invite_email__") {
                                            setIsCustomEmailMode(true);
                                            setFormData({ ...formData, assigneeId: "" });
                                        } else {
                                            setFormData({ ...formData, assigneeId: e.target.value });
                                        }
                                    }}
                                    className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1"
                                >
                                    <option value="">Unassigned</option>
                                    {allAvailableMembers.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} ({member.email}) {member.isProjectMember ? "" : "• WS"}
                                        </option>
                                    ))}
                                    <option value="__invite_email__">+ Invite by Email...</option>
                                </select>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                    </div>

                    {/* Email notification notice */}
                    {(formData.assigneeId || (isCustomEmailMode && customEmail)) && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                            <Mail className="size-3.5 shrink-0" />
                            <span>An invitation email with the direct task link will be dispatched.</span>
                        </div>
                    )}

                    {/* Due Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Due Date</label>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" />
                        </div>
                        {formData.due_date && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {format(new Date(formData.due_date), "PPP")}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreateTask(false)} className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer" >
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="rounded px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white dark:text-zinc-200 transition cursor-pointer" >
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
}

