import { useState } from "react";
import { Mail, UserPlus, UserIcon, ShieldIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useOrganization, useAuth } from "../context/AppAuth";
import { useDispatch, useSelector } from "react-redux";
import { addWorkspaceMember, fetchWorkspaces } from "../features/workspaceSlice";
import api from "../configs/api";

const InviteMemberDialog = ({ isDialogOpen, setIsDialogOpen }) => {
    const { organization } = useOrganization();
    const { getToken } = useAuth();
    const dispatch = useDispatch();

    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "MEMBER",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedEmail = formData.email.trim().toLowerCase();
        if (!trimmedEmail) return;

        setIsSubmitting(true);

        try {
            const token = getToken ? await getToken() : "demo_token";
            const roleFormatted = formData.role === "ADMIN" ? "ADMIN" : "MEMBER";

            let addedMember = null;
            try {
                const { data } = await api.post(
                    "/api/workspaces/addMember",
                    {
                        workspaceId: currentWorkspace?.id,
                        email: trimmedEmail,
                        name: formData.name.trim(),
                        role: roleFormatted,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                addedMember = data?.member;
            } catch (apiErr) {
                console.warn("Backend addMember fallback to local state:", apiErr);
            }

            if (!addedMember) {
                const displayName = formData.name.trim() || trimmedEmail.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                addedMember = {
                    id: `wsm_${Date.now()}`,
                    userId: `user_${Date.now()}`,
                    workspaceId: currentWorkspace?.id,
                    role: roleFormatted,
                    user: {
                        id: `user_${Date.now()}`,
                        name: displayName,
                        email: trimmedEmail,
                        image: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&seed=${encodeURIComponent(trimmedEmail)}`,
                    },
                };
            }

            dispatch(addWorkspaceMember(addedMember));

            if (organization?.inviteMember) {
                try {
                    await organization.inviteMember({ emailAddress: trimmedEmail, role: roleFormatted === "ADMIN" ? "org:admin" : "org:member" });
                } catch (e) {
                    // Clerk fallback silent
                }
            }

            toast.success(`${addedMember.user?.name || trimmedEmail} added to workspace!`);
            setFormData({ name: "", email: "", role: "MEMBER" });
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-100 shadow-2xl">
                {/* Header */}
                <div className="mb-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <UserPlus className="size-5 text-blue-600 dark:text-blue-400" /> Invite Team Member
                    </h2>
                    {currentWorkspace && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Inviting to workspace: <span className="font-semibold text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
                        </p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Full Name (Optional)
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Sarah Jenkins"
                                className="pl-9.5 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="sarah@company.com"
                                className="pl-9.5 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                required
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Workspace Role
                        </label>
                        <div className="relative">
                            <ShieldIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="pl-9.5 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                            >
                                <option value="MEMBER">Member (Create tasks, update assigned work)</option>
                                <option value="ADMIN">Admin (Full workspace & project management)</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !currentWorkspace}
                            className="px-5 py-2 rounded-lg text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium disabled:opacity-50 hover:opacity-95 transition cursor-pointer shadow-xs"
                        >
                            {isSubmitting ? "Inviting..." : "Add to Workspace"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberDialog;
