import { useEffect, useState, useMemo } from "react";
import { useAuth, useUser } from "../context/AppAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../configs/api";
import { ArrowLeft, CalendarIcon, MessageCircle, PenIcon, Trash2, UserPlus, Mail } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteTask, updateTask as updateTaskInStore } from "../features/workspaceSlice";

const TaskDetails = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { getToken } = useAuth();
    const { user } = useUser();
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isReassignOpen, setIsReassignOpen] = useState(false);
    const [customAssigneeEmail, setCustomAssigneeEmail] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    const { currentWorkspace } = useSelector((state) => state.workspace);

    const availableMembers = useMemo(() => {
        const list = [];
        const seen = new Set();

        (project?.members || []).forEach((m) => {
            const uid = m?.user?.id || m?.userId;
            const email = m?.user?.email;
            if (email && !seen.has(email)) {
                seen.add(email);
                list.push({ id: uid || email, name: m?.user?.name || email.split("@")[0], email, image: m?.user?.image });
            }
        });

        (currentWorkspace?.members || []).forEach((m) => {
            const uid = m?.user?.id || m?.userId;
            const email = m?.user?.email;
            if (email && !seen.has(email)) {
                seen.add(email);
                list.push({ id: uid || email, name: m?.user?.name || email.split("@")[0], email, image: m?.user?.image });
            }
        });

        return list;
    }, [project, currentWorkspace]);

    const fetchComments = async () => {
        if (!taskId) return;
        try {
            const token = getToken ? await getToken() : "demo_token";
            const { data } = await api.get(`/api/comments/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(data.comments || []);
        } catch (error) {
            console.warn("Fetch comments notice:", error?.message);
        }
    };

    const fetchTaskDetails = async () => {
        setLoading(true);
        if (!projectId || !taskId) return;

        const proj = currentWorkspace?.projects?.find((p) => p.id === projectId);
        if (!proj) return;

        const tsk = proj.tasks?.find((t) => t.id === taskId);
        if (!tsk) return;

        setTask(tsk);
        setProject(proj);
        setLoading(false);
    };

    const handleAssignMember = async (assigneeId, assigneeEmail) => {
        if (!task) return;
        setIsAssigning(true);
        try {
            const token = getToken ? await getToken() : "demo_token";
            const { data } = await api.put(
                `/api/tasks/${task.id}`,
                {
                    assigneeId: assigneeId || undefined,
                    assigneeEmail: assigneeEmail || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data?.task) {
                setTask(data.task);
                dispatch(updateTaskInStore(data.task));
            }
            toast.success("Task reassigned & notification email dispatched!");
            setIsReassignOpen(false);
            setCustomAssigneeEmail("");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to update assignee");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return;

        const commentText = newComment.trim();
        setNewComment("");

        const optimisticComment = {
            id: `comm_${Date.now()}`,
            content: commentText,
            taskId: task.id,
            userId: user?.id || "user_1",
            createdAt: new Date().toISOString(),
            user: {
                id: user?.id || "user_1",
                name: user?.fullName || user?.firstName || "Alex Smith",
                email: user?.primaryEmailAddress?.emailAddress || user?.email || "alexsmith@example.com",
                image: user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
            }
        };

        setComments((prev) => [...prev, optimisticComment]);
        toast.success("Comment added");

        try {
            const token = getToken ? await getToken() : "demo_token";
            const { data } = await api.post(
                `/api/comments`,
                { taskId: task.id, content: commentText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data?.comment?.id) {
                setComments((prev) => prev.map(c => c.id === optimisticComment.id ? data.comment : c));
            }
        } catch (err) {
            console.warn("Comment sync notice:", err?.message);
        }
    };

    const handleDeleteTask = async () => {
        if (!taskId) return;
        setIsDeleting(true);
        // Instant optimistic delete & navigate
        dispatch(deleteTask([taskId]));
        toast.success("Task deleted successfully");
        navigate(projectId ? `/projectsDetail?id=${projectId}&tab=tasks` : '/projects');

        try {
            const token = getToken ? await getToken() : "demo_token";
            if (token) {
                await api.post("/api/tasks/delete", { tasksIds: [taskId] }, { headers: { Authorization: `Bearer ${token}` } });
            }
        } catch (apiErr) {
            console.warn("API task delete notice:", apiErr?.response?.data?.message || apiErr.message);
        }
    };

    useEffect(() => { fetchTaskDetails(); }, [taskId, currentWorkspace]);

    useEffect(() => {
        if (taskId && task) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, task]);

    if (loading) return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading task details...</div>;
    if (!task) return (
        <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
            <p className="text-2xl mt-20 mb-6">Task not found</p>
            <button
                onClick={() => navigate(projectId ? `/projectsDetail?id=${projectId}` : '/projects')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
                Back to Project
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto sm:p-4 text-gray-900 dark:text-zinc-100">
            {/* Top Bar with Navigation and Task Actions */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
                <button
                    onClick={() => navigate(projectId ? `/projectsDetail?id=${projectId}&tab=tasks` : '/projects')}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to Project</span>
                </button>

                <div className="flex items-center gap-3">
                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 p-1.5 rounded-lg border border-red-200 dark:border-red-900">
                            <span className="text-xs text-red-700 dark:text-red-300 font-medium px-2">Confirm delete?</span>
                            <button
                                disabled={isDeleting}
                                onClick={handleDeleteTask}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition cursor-pointer"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-md transition cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            id="delete-task-action-btn"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/60 transition cursor-pointer"
                        >
                            <Trash2 className="size-4" />
                            <span>Delete Task</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col-reverse lg:flex-row gap-6">
                {/* Left: Comments / Chatbox */}
                <div className="w-full lg:w-2/3">
                    <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col lg:h-[75vh] shadow-xs">
                        <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                            <MessageCircle className="size-5 text-blue-500" /> Task Discussion ({comments.length})
                        </h2>

                        <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                            {comments.length > 0 ? (
                                <div className="flex flex-col gap-4 mb-6 mr-2">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className={`sm:max-w-4/5 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 p-3.5 rounded-xl ${comment.user?.id === user?.id ? "ml-auto bg-blue-50/50" : "mr-auto bg-zinc-50/80"}`} >
                                            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500 dark:text-zinc-400">
                                                <img src={comment.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} alt="avatar" className="size-5 rounded-full object-cover" />
                                                <span className="font-semibold text-gray-900 dark:text-white">{comment.user?.name || "Team Member"}</span>
                                                <span className="text-gray-400 dark:text-zinc-500">
                                                    • {format(new Date(comment.createdAt || new Date()), "dd MMM yyyy, HH:mm")}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-zinc-200 mt-1">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-zinc-500 mb-4 text-sm text-center py-10">No comments yet. Start the conversation!</p>
                            )}
                        </div>

                        {/* Add Comment */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                            />
                            <button onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-xs cursor-pointer whitespace-nowrap" >
                                Post Comment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Task + Project Info */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    {/* Task Info */}
                    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
                        <div className="mb-4">
                            <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Task Overview</span>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">{task.title}</h1>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
                                    {task.status}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                                    {task.type}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                                    {task.priority}
                                </span>
                            </div>
                        </div>

                        {task.description && (
                            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>
                        )}

                        <hr className="border-zinc-200 dark:border-zinc-800 my-4" />

                        <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-zinc-300">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500 font-medium">Assignee</span>
                                    <button
                                        onClick={() => setIsReassignOpen(!isReassignOpen)}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                                    >
                                        {isReassignOpen ? "Close" : "Reassign / Invite"}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <img src={task.assignee?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} className="size-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" alt="avatar" />
                                    <div>
                                        <p className="text-xs font-medium">{task.assignee?.name || "Unassigned"}</p>
                                        {task.assignee?.email && (
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{task.assignee.email}</p>
                                        )}
                                    </div>
                                </div>

                                {isReassignOpen && (
                                    <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-2">
                                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Assign to existing member:</p>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) handleAssignMember(e.target.value, null);
                                            }}
                                            disabled={isAssigning}
                                            className="w-full text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select a member...</option>
                                            {availableMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} ({m.email})
                                                </option>
                                            ))}
                                        </select>

                                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 pt-1">Or invite by email:</p>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="email"
                                                placeholder="teammate@company.com"
                                                value={customAssigneeEmail}
                                                onChange={(e) => setCustomAssigneeEmail(e.target.value)}
                                                className="w-full text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (customAssigneeEmail.trim()) {
                                                        handleAssignMember(null, customAssigneeEmail.trim());
                                                    }
                                                }}
                                                disabled={isAssigning || !customAssigneeEmail.trim()}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium shrink-0 cursor-pointer"
                                            >
                                                Invite
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                                            <Mail className="size-3 shrink-0" />
                                            <span>Sends task invitation email instantly</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-zinc-500 font-medium">Due Date</span>
                                <div className="flex items-center gap-1.5 text-xs">
                                    <CalendarIcon className="size-3.5 text-gray-500 dark:text-zinc-400" />
                                    <span>{format(new Date(task.due_date || new Date()), "dd MMM yyyy")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Info */}
                    {project && (
                        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-800 shadow-xs">
                            <p className="text-xs uppercase font-bold tracking-wider text-zinc-500 mb-2">Attached Project</p>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                <PenIcon className="size-4 text-blue-500" /> {project.name}
                            </h2>
                            <p className="text-xs text-zinc-500 mt-2">Started: {format(new Date(project.start_date || new Date()), "dd MMM yyyy")}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Status: {project.status}</span>
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Progress: {project.progress || 0}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;
