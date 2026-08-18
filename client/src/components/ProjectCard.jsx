import { Link } from "react-router-dom";
import { motion } from "motion/react";

const statusColors = {
    PLANNING: "bg-gray-200 dark:bg-zinc-600 text-gray-900 dark:text-zinc-200",
    ACTIVE: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800",
    ON_HOLD: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800",
    COMPLETED: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800",
    CANCELLED: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800",
};

const ProjectCard = ({ project, index = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            className="h-full"
        >
            <Link
                to={`/projectsDetail?id=${project.id}&tab=tasks`}
                className="flex flex-col justify-between h-full bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700/80 rounded-xl p-5 shadow-xs transition-all duration-200 group"
            >
                {/* Header */}
                <div>
                    <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1 truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-gray-500 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                                {project.description || "No description provided"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between my-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[project.status] || 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`} >
                            {project.status ? project.status.replace("_", " ") : "ACTIVE"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400 capitalize font-medium">
                            {project.priority ? project.priority.toLowerCase() : "medium"} priority
                        </span>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500 dark:text-zinc-400">Progress</span>
                        <span className="text-gray-700 dark:text-zinc-200">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress || 0}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full bg-blue-500"
                        />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProjectCard;
