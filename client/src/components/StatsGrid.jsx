import { FolderOpen, CheckCircle, Users, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";

export default function StatsGrid() {
    const currentWorkspace = useSelector(
        (state) => state?.workspace?.currentWorkspace || null
    );

    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        myTasks: 0,
        overdueIssues: 0,
    });

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
            title: "Overdue",
            value: stats.overdueIssues,
            subtitle: "need attention",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-500",
        },
    ];

    useEffect(() => {
        if (currentWorkspace && currentWorkspace.projects) {
            setStats({
                totalProjects: currentWorkspace.projects.length,
                activeProjects: currentWorkspace.projects.filter(
                    (p) => p.status !== "CANCELLED" && p.status !== "COMPLETED"
                ).length,
                completedProjects: currentWorkspace.projects
                    .filter((p) => p.status === "COMPLETED")
                    .reduce((acc, project) => acc + (project.tasks ? project.tasks.length : 0), 0),
                myTasks: currentWorkspace.projects.reduce(
                    (acc, project) =>
                        acc +
                        (project.tasks
                            ? project.tasks.filter(
                                  (t) =>
                                      t.assignee?.email === currentWorkspace.owner?.email ||
                                      t.assigneeId === "user_1"
                              ).length
                            : 0),
                    0
                ),
                overdueIssues: currentWorkspace.projects.reduce(
                    (acc, project) =>
                        acc +
                        (project.tasks
                            ? project.tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()).length
                            : 0),
                    0
                ),
            });
        }
    }, [currentWorkspace]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-9">
            {statCards.map(
                ({ icon: Icon, title, value, subtitle, bgColor, textColor }, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-200 rounded-xl shadow-xs"
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
                    </motion.div>
                )
            )}
        </div>
    );
}
