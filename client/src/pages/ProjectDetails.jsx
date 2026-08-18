import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, SettingsIcon, BarChart3Icon, CalendarIcon, FileStackIcon, ZapIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProjectAnalytics from "../components/ProjectAnalytics";
import ProjectSettings from "../components/ProjectSettings";
import CreateTaskDialog from "../components/CreateTaskDialog";
import ProjectCalendar from "../components/ProjectCalendar";
import ProjectTasks from "../components/ProjectTasks";

export default function ProjectDetail() {

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab');
    const id = searchParams.get('id');

    const navigate = useNavigate();
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [activeTab, setActiveTab] = useState(tab || "tasks");

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [tab]);

    useEffect(() => {
        if (projects && projects.length > 0) {
            const proj = projects.find((p) => p.id === id);
            setProject(proj);
            setTasks(proj?.tasks || []);
        }
    }, [id, projects]);

    const statusColors = {
        PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
        ACTIVE: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
        ON_HOLD: "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
        COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
        CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
    };

    if (!project) {
        return (
            <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
                <p className="text-3xl md:text-5xl mt-40 mb-10">Project not found</p>
                <button
                    onClick={() => navigate('/projects')}
                    className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between max-w-6xl"
            >
                <div className="flex items-center gap-4">
                    <button className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer transition" onClick={() => navigate('/projects')}>
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold">{project.name}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[project.status]}`} >
                            {project.status.replace("_", " ")}
                        </span>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateTask(true)}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xs cursor-pointer"
                >
                    <PlusIcon className="size-4" />
                    New Task
                </motion.button>
            </motion.div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:flex flex-wrap gap-4">
                {[
                    { label: "Total Tasks", value: tasks.length, color: "text-zinc-900 dark:text-white" },
                    { label: "Completed", value: tasks.filter((t) => t.status === "DONE").length, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO").length, color: "text-amber-600 dark:text-amber-400" },
                    { label: "Team Members", value: project.members?.length || 0, color: "text-blue-600 dark:text-blue-400" },
                ].map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.05 }}
                        whileHover={{ y: -2 }}
                        className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex justify-between sm:min-w-56 p-4 py-3 rounded-xl shadow-xs"
                    >
                        <div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{card.label}</div>
                            <div className={`text-2xl font-bold ${card.color} mt-0.5`}>{card.value}</div>
                        </div>
                        <ZapIcon className={`size-4 ${card.color}`} />
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="space-y-4">
                <div className="inline-flex flex-wrap max-sm:grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    {[
                        { key: "tasks", label: "Tasks", icon: FileStackIcon },
                        { key: "calendar", label: "Calendar", icon: CalendarIcon },
                        { key: "analytics", label: "Analytics", icon: BarChart3Icon },
                        { key: "settings", label: "Settings", icon: SettingsIcon },
                    ].map((tabItem) => (
                        <button
                            key={tabItem.key}
                            onClick={() => { setActiveTab(tabItem.key); setSearchParams({ id: id, tab: tabItem.key }) }}
                            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${activeTab === tabItem.key
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                        >
                            <tabItem.icon className="size-3.5" />
                            {tabItem.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="mt-4"
                    >
                        {activeTab === "tasks" && (
                            <div className="dark:bg-zinc-900/40 rounded-xl max-w-6xl">
                                <ProjectTasks tasks={tasks} />
                            </div>
                        )}
                        {activeTab === "analytics" && (
                            <div className="dark:bg-zinc-900/40 rounded-xl max-w-6xl">
                                <ProjectAnalytics tasks={tasks} project={project} />
                            </div>
                        )}
                        {activeTab === "calendar" && (
                            <div className="dark:bg-zinc-900/40 rounded-xl max-w-6xl">
                                <ProjectCalendar tasks={tasks} />
                            </div>
                        )}
                        {activeTab === "settings" && (
                            <div className="dark:bg-zinc-900/40 rounded-xl max-w-6xl">
                                <ProjectSettings project={project} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Create Task Modal */}
            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={id} />}
        </div>
    );
}
