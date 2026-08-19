import { useMemo } from "react";
import { GitCommit, MessageSquare, Clock, Bug, Zap, Square } from "lucide-react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-500 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-500 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-500 dark:text-green-400" },
    IMPROVEMENT: { icon: MessageSquare, color: "text-amber-500 dark:text-amber-400" },
    OTHER: { icon: GitCommit, color: "text-purple-500 dark:text-purple-400" },
};

const statusColors = {
    TODO: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
    IN_PROGRESS: "bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900",
    DONE: "bg-emerald-200 text-emerald-800 dark:bg-emerald-500 dark:text-emerald-900",
};

const RecentActivity = () => {
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const tasks = useMemo(() => {
        if (!currentWorkspace?.projects) return [];
        return currentWorkspace.projects
            .flatMap((project) => (project.tasks || []).map(t => ({ ...t, projectId: project.id })))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
            .slice(0, 6);
    }, [currentWorkspace]);

    return (
        <div className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-xl transition-all duration-200 overflow-hidden shadow-xs">
            <div className="border-b border-zinc-200 dark:border-zinc-800/80 p-4">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Recent Activity</h2>
            </div>

            <div className="p-0">
                {tasks.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-zinc-600 dark:text-zinc-500" />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400">No recent activity</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {tasks.map((task) => {
                            const TypeIcon = typeIcons[task.type]?.icon || Square;
                            const iconColor = typeIcons[task.type]?.color || "text-gray-500 dark:text-gray-400";
                            const taskDate = task.updatedAt || task.createdAt;

                            return (
                                <Link
                                    key={task.id}
                                    to={`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`}
                                    className="block p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                            <TypeIcon className={`w-4 h-4 ${iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1.5">
                                                <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                    {task.title}
                                                </h4>
                                                <span className={`ml-2 px-2 py-0.5 rounded text-[11px] font-medium ${statusColors[task.status] || "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"}`}>
                                                    {(task.status || "TODO").replace("_", " ")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span className="capitalize">{(task.type || "task").toLowerCase()}</span>
                                                {task.assignee && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-4 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full flex items-center justify-center text-[10px] font-semibold text-zinc-800 dark:text-zinc-200">
                                                            {task.assignee.name ? task.assignee.name[0].toUpperCase() : 'U'}
                                                        </div>
                                                        <span>{task.assignee.name || "Assigned"}</span>
                                                    </div>
                                                )}
                                                <span>
                                                    {taskDate ? format(new Date(taskDate), "MMM d, h:mm a") : "Recently"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
