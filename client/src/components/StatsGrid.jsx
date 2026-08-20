import { FolderOpen, CheckCircle, Users, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function StatsGrid() {
    const currentWorkspace = useSelector(
        (state) => state?.workspace?.currentWorkspace || null
    );

    const stats = useMemo(() => {
        if (!currentWorkspace?.projects) {
            return {
                totalProjects: 0,
                activeProjects: 0,
                completedProjects: 0,
                myTasks: 0,
                overdueIssues: 0,
            };
        }

        const now = new Date();
        const projects = currentWorkspace.projects;

        const totalProjects = projects.length;
        const activeProjects = projects.filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED").length;
        const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;

        let myTasks = 0;
        let overdueIssues = 0;

        for (const project of projects) {
            if (Array.isArray(project.tasks)) {
                for (const task of project.tasks) {
                    if (
                        task.assignee?.email === currentWorkspace.owner?.email ||
                        task.assigneeId === "user_1" ||
                        task.assignee?.id === "user_1"
                    ) {
                        myTasks++;
                    }
                    if (task.status !== "DONE" && task.due_date && new Date(task.due_date) < now) {
                        overdueIssues++;
                    }
                }
            }
        }

        return {
            totalProjects,
            activeProjects,
            completedProjects,
            myTasks,
            overdueIssues,
        };
    }, [currentWorkspace]);

    const statCards = [
        {
            icon: FolderOpen,
            title: "Total Projects",
            value: stats.totalProjects,
            subtitle: `projects in ${currentWorkspace?.name || 'workspace'}`,
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
        },
        {
            icon: CheckCircle,
            title: "Completed Projects",
            value: stats.completedProjects,
            subtitle: `of ${stats.totalProjects} total`,
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-500",
        },
        {
            icon: Users,
            title: "My Tasks",
            value: stats.myTasks,
            subtitle: "assigned to me",
            bgColor: "bg-purple-500/10",
            textColor: "text-purple-500",
        },
        {
            icon: AlertTriangle,
            title: "Overdue Tasks",
            value: stats.overdueIssues,
            subtitle: "need attention",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-500",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-9">
            {statCards.map(
                ({ icon: Icon, title, value, subtitle, bgColor, textColor }, i) => (
                    <div
                        key={title}
                        className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:-translate-y-1 transition-all duration-200 rounded-xl shadow-xs"
                    >
                        <div className="p-6 py-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 font-medium">
                                        {title}
                                    </p>
                                    <p className="text-3xl font-bold text-zinc-800 dark:text-white">
                                        {value}
                                    </p>
                                    {subtitle && (
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20 dark:backdrop-blur-xs`}>
                                    <Icon size={20} className={textColor} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
