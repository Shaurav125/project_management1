import { useMemo } from "react";
import { ArrowRight, Clock, AlertTriangle, User } from "lucide-react";
import { useUser } from "../context/AppAuth";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function TasksSummary() {
    const { user } = useUser();
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const { myTasks, overdueTasks, inProgressIssues } = useMemo(() => {
        if (!currentWorkspace?.projects) {
            return { myTasks: [], overdueTasks: [], inProgressIssues: [] };
        }

        const now = new Date();
        const allTasks = currentWorkspace.projects.flatMap((project) =>
            (project.tasks || []).map((t) => ({ ...t, projectId: project.id }))
        );

        const currentUserId = user?.id || "user_1";
        const currentUserEmail = user?.email || user?.primaryEmailAddress?.emailAddress || currentWorkspace.owner?.email;

        const my = allTasks.filter(
            (t) =>
                t.assigneeId === currentUserId ||
                t.assignee?.id === currentUserId ||
                t.assignee?.email === currentUserEmail
        );
        const overdue = allTasks.filter(
            (t) => t.due_date && new Date(t.due_date) < now && t.status !== "DONE"
        );
        const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS");

        return { myTasks: my, overdueTasks: overdue, inProgressIssues: inProgress };
    }, [currentWorkspace, user]);

    const summaryCards = [
        {
            title: "My Tasks",
            count: myTasks.length,
            icon: User,
            color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
            items: myTasks.slice(0, 3)
        },
        {
            title: "Overdue",
            count: overdueTasks.length,
            icon: AlertTriangle,
            color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
            items: overdueTasks.slice(0, 3)
        },
        {
            title: "In Progress",
            count: inProgressIssues.length,
            icon: Clock,
            color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
            items: inProgressIssues.slice(0, 3)
        }
    ];

    return (
        <div className="space-y-6">
            {summaryCards.map((card) => (
                <div key={card.title} className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="border-b border-zinc-200 dark:border-zinc-800/80 p-4 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-50 dark:bg-zinc-800/80 dark:backdrop-blur-xs rounded-lg">
                                <card.icon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                            </div>
                            <div className="flex items-center justify-between flex-1">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-white">{card.title}</h3>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${card.color}`}>
                                    {card.count}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        {card.items.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                                No {card.title.toLowerCase()}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {card.items.map((issue) => (
                                    <Link
                                        key={issue.id}
                                        to={`/taskDetails?projectId=${issue.projectId}&taskId=${issue.id}`}
                                        className="block p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent dark:border-zinc-800/40 transition-colors cursor-pointer"
                                    >
                                        <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                            {issue.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-zinc-400 capitalize mt-1">
                                            {issue.type || "TASK"} • {(issue.priority || "MEDIUM").toLowerCase()} priority
                                        </p>
                                    </Link>
                                ))}
                                {card.count > 3 && (
                                    <Link
                                        to="/projects"
                                        className="flex items-center justify-center w-full text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white mt-2 cursor-pointer transition-colors"
                                    >
                                        View {card.count - 3} more <ArrowRight className="w-3 h-3 ml-1.5" />
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
