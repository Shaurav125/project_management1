import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Trash2, AlertCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { deleteProject } from "../features/workspaceSlice";
import { useAuth } from "../context/AppAuth";
import api from "../configs/api";
import toast from "react-hot-toast";

const statusColors = {
    PLANNING: "bg-gray-200 dark:bg-zinc-600 text-gray-900 dark:text-zinc-200",
    ACTIVE: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800",
    ON_HOLD: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800",
    COMPLETED: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800",
    CANCELLED: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800",
};

const ProjectCard = ({ project, index = 0 }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleting(true);
        const toastId = toast.loading("Deleting project...");
        try {
            const token = getToken ? await getToken() : "demo_token";
            try {
                await api.delete(`/api/projects/${project.id}`, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) {
                console.warn("Delete project notice:", err);
            }
            dispatch(deleteProject(project.id));
            toast.success("Project deleted", { id: toastId });
            setShowDeleteModal(false);
        } catch (error) {
            toast.error("Failed to delete project", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="h-full relative"
            >
                <Link
                    to={`/projectsDetail?id=${project.id}&tab=tasks`}
                    className="flex flex-col justify-between h-full bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700/80 rounded-xl p-5 shadow-xs transition-all duration-200 group"
                >
                    {/* Header */}
                    <div>
                        <div className="flex items-start justify-between mb-2.5">
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-1 truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-gray-500 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                                    {project.description || "No description provided"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowDeleteModal(true);
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Delete project"
                            >
                                <Trash2 className="size-4" />
                            </button>
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

            {/* Quick Delete Modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(false);
                    }}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl">
                                <AlertCircle className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete Project?</h3>
                                <p className="text-xs text-zinc-500">This action will delete all project tasks.</p>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">"{project.name}"</span>?
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 className="size-3.5" />
                                {isDeleting ? "Deleting..." : "Delete Project"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectCard;
