import api from "../configs/api";
import toast from "react-hot-toast";
import { useState } from "react";
import { Mail, UserPlus, XIcon, PlusCircle, CheckIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AppAuth";
import { addProjectMember, fetchWorkspaces } from "../features/workspaceSlice";

const AddProjectMember = ({ isDialogOpen, setIsDialogOpen }) => {

    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const { getToken } = useAuth();
    const dispatch = useDispatch();

    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const project = currentWorkspace?.projects?.find((p) => p.id === id);

    const projectMembersEmails = (project?.members || []).map((member) => member?.user?.email).filter(Boolean);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const availableMembers = (currentWorkspace?.members || []).filter(
        (member) => member?.user?.email && !projectMembersEmails.includes(member.user.email)
    );

    const handleAddMember = async (emailToAdd) => {
        if (!project || !emailToAdd) return;
        const trimmed = emailToAdd.trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@")) {
            return toast.error("Please enter a valid email address");
        }

        setIsAdding(true);

        try {
            const token = getToken ? await getToken() : "demo_token";
            let addedMember = null;
            try {
                const { data } = await api.post(
                    `/api/projects/${project.id}/addMember`,
                    { email: trimmed },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                addedMember = data?.member;
            } catch (err) {
                console.warn("Add member api notice:", err?.message);
            }

            if (!addedMember) {
                const foundWorkspaceMember = currentWorkspace?.members?.find(m => m.user?.email === trimmed);
                const displayName = foundWorkspaceMember?.user?.name || trimmed.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                addedMember = {
                    id: `pm_${Date.now()}`,
                    userId: foundWorkspaceMember?.userId || `user_${Date.now()}`,
                    projectId: project.id,
                    user: {
                        id: foundWorkspaceMember?.userId || `user_${Date.now()}`,
                        name: displayName,
                        email: trimmed,
                        image: foundWorkspaceMember?.user?.image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(trimmed)}`,
                    }
                };
            }

            dispatch(addProjectMember({ projectId: project.id, member: addedMember }));
            toast.success(`Added ${trimmed} to project`);
            setSelectedEmail('');
            setCustomEmail('');
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsAdding(false);
        }
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-100 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <UserPlus className="size-5 text-blue-600 dark:text-blue-400" /> Add Team Member
                        </h2>
                        {project && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Project: <span className="font-medium text-blue-600 dark:text-blue-400">{project.name}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setIsDialogOpen(false)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                        <XIcon className="size-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Option 1: Select from existing Workspace Members */}
                    {availableMembers.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                Workspace Members
                            </label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {availableMembers.map((member) => (
                                    <div
                                        key={member.user?.email || member.userId}
                                        className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {member.user?.image ? (
                                                <img src={member.user.image} alt={member.user.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                                                    {(member.user?.name || member.user?.email || "M")[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="truncate text-left">
                                                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{member.user?.name || member.user?.email}</p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{member.user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isAdding}
                                            onClick={() => handleAddMember(member.user?.email)}
                                            className="px-2.5 py-1 text-xs font-medium rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer shrink-0"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Option 2: Add by email directly */}
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Add by Email Address
                        </label>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAddMember(customEmail);
                            }}
                            className="flex gap-2"
                        >
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="pl-9.5 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isAdding || !customEmail.trim()}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50 hover:opacity-95 transition cursor-pointer shadow-xs"
                            >
                                {isAdding ? "Adding..." : "Add"}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProjectMember;
