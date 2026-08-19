import api from "../configs/api";
import toast from "react-hot-toast";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "../context/AppAuth";
import { useDispatch } from "react-redux";
import { deleteTask, updateTask } from "../features/workspaceSlice";
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Trash, XIcon, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
    LOW: { background: "bg-red-100 dark:bg-red-950", prioritycolor: "text-red-600 dark:text-red-400" },
    MEDIUM: { background: "bg-blue-100 dark:bg-blue-950", prioritycolor: "text-blue-600 dark:text-blue-400" },
    HIGH: { background: "bg-emerald-100 dark:bg-emerald-950", prioritycolor: "text-emerald-600 dark:text-emerald-400" },
};

const ProjectTasks = ({ tasks }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [selectedTasks, setSelectedTasks] = useState([]);

    const [filters, setFilters] = useState({
        status: "",
        type: "",
        priority: "",
        assignee: "",
    });

    const assigneeList = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))),
        [tasks]
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const { status, type, priority, assignee } = filters;
            return (
                (!status || task.status === status) &&
                (!type || task.type === type) &&
                (!priority || task.priority === priority) &&
                (!assignee || task.assignee?.name === assignee)
            );
        });
    }, [filters, tasks]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (taskId, newStatus) => {
        // Instant optimistic update
        const taskToUpdate = tasks.find((t) => t.id === taskId);
        if (taskToUpdate) {
            dispatch(updateTask({ ...taskToUpdate, status: newStatus }));
        }

        try {
            const token = getToken ? await getToken() : "demo_token";
            await api.put(`/api/tasks/${taskId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Task status updated");
        } catch (apiErr) {
            console.warn("Status update sync notice:", apiErr?.response?.data?.message || apiErr.message);
        }
    };

    const handleDeleteTasks = async (taskIds) => {
        const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
        if (ids.length === 0) return;

        // Instant optimistic UI delete
        dispatch(deleteTask(ids));
        setSelectedTasks((prev) => prev.filter((id) => !ids.includes(id)));
        toast.success(ids.length === 1 ? "Task deleted" : "Tasks deleted");

        try {
            const token = getToken ? await getToken() : "demo_token";
            if (token) {
                await api.post("/api/tasks/delete", { tasksIds: ids }, { headers: { Authorization: `Bearer ${token}` } });
            }
        } catch (apiErr) {
            console.warn("API task deletion sync notice:", apiErr?.response?.data?.message || apiErr.message);
        }
    };

    return (
        <div>
            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    {["status", "type", "priority", "assignee"].map((name) => {
                        const options = {
                            status: [
                                { label: "All Statuses", value: "" },
                                { label: "To Do", value: "TODO" },
                                { label: "In Progress", value: "IN_PROGRESS" },
                                { label: "Done", value: "DONE" },
                            ],
                            type: [
                                { label: "All Types", value: "" },
                                { label: "Task", value: "TASK" },
                                { label: "Bug", value: "BUG" },
                                { label: "Feature", value: "FEATURE" },
                                { label: "Improvement", value: "IMPROVEMENT" },
                                { label: "Other", value: "OTHER" },
                            ],
                            priority: [
                                { label: "All Priorities", value: "" },
                                { label: "Low", value: "LOW" },
                                { label: "Medium", value: "MEDIUM" },
                                { label: "High", value: "HIGH" },
                            ],
                            assignee: [
                                { label: "All Assignees", value: "" },
                                ...assigneeList.map((n) => ({ label: n, value: n })),
                            ],
                        };
                        return (
                            <select
                                key={name}
                                name={name}
                                value={filters[name]}
                                onChange={handleFilterChange}
                                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 outline-none px-3 py-1.5 rounded-lg text-sm text-zinc-900 dark:text-zinc-200 cursor-pointer shadow-xs"
                            >
                                {options[name].map((opt, idx) => (
                                    <option key={idx} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        );
                    })}

                    {/* Reset filters */}
                    {(filters.status || filters.type || filters.priority || filters.assignee) && (
                        <button
                            type="button"
                            onClick={() => setFilters({ status: "", type: "", priority: "", assignee: "" })}
                            className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm transition-colors cursor-pointer"
                        >
                            <XIcon className="size-3.5" /> Reset
                        </button>
                    )}
                </div>

                {selectedTasks.length > 0 && (
                    <button
                        type="button"
                        id="bulk-delete-tasks-btn"
                        onClick={() => handleDeleteTasks(selectedTasks)}
                        className="px-3.5 py-1.5 flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition shadow-xs cursor-pointer"
                    >
                        <Trash className="size-4" /> Delete Selected ({selectedTasks.length})
                    </button>
                )}
            </div>

            {/* Tasks Table */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900/60">
                <div className="w-full">
                    {/* Desktop/Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-zinc-900 dark:text-zinc-300">
                            <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                                <tr>
                                    <th className="pl-3 pr-2 py-3 w-10">
                                        <input
                                            onChange={() => selectedTasks.length === filteredTasks.length && filteredTasks.length > 0 ? setSelectedTasks([]) : setSelectedTasks(filteredTasks.map((t) => t.id))}
                                            checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
                                            type="checkbox"
                                            className="size-3.5 accent-blue-600 rounded cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 pl-0 py-3 font-semibold">Title</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold">Priority</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Assignee</th>
                                    <th className="px-4 py-3 font-semibold">Due Date</th>
                                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                                {filteredTasks.length > 0 ? (
                                    filteredTasks.map((task) => {
                                        const { icon: Icon, color } = typeIcons[task.type] || {};
                                        const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                        return (
                                            <tr
                                                key={task.id}
                                                onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                                className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                            >
                                                <td onClick={e => e.stopPropagation()} className="pl-3 pr-2 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="size-3.5 accent-blue-600 rounded cursor-pointer"
                                                        onChange={() =>
                                                            selectedTasks.includes(task.id)
                                                                ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id))
                                                                : setSelectedTasks((prev) => [...prev, task.id])
                                                        }
                                                        checked={selectedTasks.includes(task.id)}
                                                    />
                                                </td>
                                                <td className="px-4 pl-0 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{task.title}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {Icon && <Icon className={`size-3.5 ${color}`} />}
                                                        <span className={`uppercase text-xs font-semibold ${color}`}>{task.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${background} ${prioritycolor}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-3">
                                                    <select
                                                        name="status"
                                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                        value={task.status}
                                                        className="bg-transparent border border-zinc-200 dark:border-zinc-700 outline-none px-2 py-1 rounded-md text-xs text-zinc-900 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                                    >
                                                        <option value="TODO">To Do</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="DONE">Done</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <img src={task.assignee?.image} className="size-5 rounded-full object-cover" alt="avatar" />
                                                        <span className="truncate">{task.assignee?.name || "Unassigned"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon className="size-3.5" />
                                                        {format(new Date(task.due_date || new Date()), "dd MMM yyyy")}
                                                    </div>
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        id={`delete-task-btn-${task.id}`}
                                                        title="Delete Task"
                                                        onClick={() => handleDeleteTasks([task.id])}
                                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                                    >
                                                        <Trash className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                                            No tasks found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile/Card View */}
                    <div className="lg:hidden flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => {
                                const { icon: Icon, color } = typeIcons[task.type] || {};
                                const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                return (
                                    <div key={task.id} className="p-4 flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}>
                                                <input
                                                    type="checkbox"
                                                    className="size-4 accent-blue-600 rounded cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() =>
                                                        selectedTasks.includes(task.id)
                                                            ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id))
                                                            : setSelectedTasks((prev) => [...prev, task.id])
                                                    }
                                                    checked={selectedTasks.includes(task.id)}
                                                />
                                                <h3 className="text-zinc-900 dark:text-zinc-200 text-sm font-semibold truncate cursor-pointer hover:text-blue-500">{task.title}</h3>
                                            </div>
                                            <button
                                                type="button"
                                                title="Delete Task"
                                                onClick={() => handleDeleteTasks([task.id])}
                                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                            >
                                                <Trash className="size-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                {Icon && <Icon className={`size-3.5 ${color}`} />}
                                                <span className={`${color} uppercase font-semibold`}>{task.type}</span>
                                                <span className={`px-2 py-0.5 rounded-full font-medium ${background} ${prioritycolor}`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-zinc-500">
                                                <CalendarIcon className="size-3.5" />
                                                {format(new Date(task.due_date || new Date()), "dd MMM")}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-1">
                                            <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                                <img src={task.assignee?.image} className="size-5 rounded-full object-cover" alt="avatar" />
                                                <span className="truncate">{task.assignee?.name || "Unassigned"}</span>
                                            </div>

                                            <select
                                                name="status"
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                value={task.status}
                                                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 outline-none px-2 py-1 rounded-md text-xs text-zinc-900 dark:text-zinc-200"
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-zinc-500 dark:text-zinc-400 py-6">
                                No tasks found matching your filters.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTasks;
