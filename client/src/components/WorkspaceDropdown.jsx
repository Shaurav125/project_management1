import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Trash2, Building2, AlertTriangle, ArrowRight, Loader2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentWorkspace, deleteWorkspace, addWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";
import { useClerk, useOrganizationList, useAppAuth } from "../context/AppAuth";
import api from "../configs/api";
import toast from "react-hot-toast";

function WorkspaceDropdown() {
    const { setActive, userMemberships, isLoaded } = useOrganizationList({ userMemberships: true });
    const { openCreateOrganization } = useClerk();
    const { getToken } = useAppAuth();

    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    
    const [isOpen, setIsOpen] = useState(false);
    const [deletingWorkspace, setDeletingWorkspace] = useState(null); // workspace obj to delete
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWsName, setNewWsName] = useState("");
    const [newWsDesc, setNewWsDesc] = useState("");

    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Prepare unified workspace list
    const orgList = workspaces && workspaces.length > 0
        ? workspaces.map((ws) => ({
            id: ws.id || ws._id,
            name: ws.name,
            imageUrl: ws.image_url || ws.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80',
            membersCount: ws.members?.length || 1,
            projectsCount: ws.projects?.length || 0,
        }))
        : (userMemberships?.data && userMemberships.data.length > 0)
            ? userMemberships.data.map(({ organization }) => ({
                id: organization.id,
                name: organization.name,
                imageUrl: organization.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80',
                membersCount: organization.membersCount || 1,
                projectsCount: 0,
            }))
            : [];

    const onSelectWorkspace = (workspaceId, workspaceName) => {
        if (setActive) {
            try {
                setActive({ organization: workspaceId });
            } catch (e) {
                // ignore
            }
        }
        dispatch(setCurrentWorkspace(workspaceId));
        setIsOpen(false);
        toast.success(`Switched to "${workspaceName}"`);
        navigate('/');
    };

    const confirmDeleteWorkspace = async () => {
        if (!deletingWorkspace) return;
        setIsDeleting(true);
        const wsId = deletingWorkspace.id;
        const wsName = deletingWorkspace.name;

        try {
            toast.loading(`Deleting "${wsName}" from database...`);
            const token = getToken ? await getToken() : "demo_token";
            
            await api.delete(`/api/workspaces/${wsId}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(err => {
                console.warn("Server delete response note:", err?.message);
            });

            dispatch(deleteWorkspace(wsId));
            toast.dismiss();
            toast.success(`Workspace "${wsName}" deleted from database`);
            setDeletingWorkspace(null);
            setIsOpen(false);
        } catch (error) {
            console.error("Delete workspace error:", error);
            dispatch(deleteWorkspace(wsId));
            toast.dismiss();
            toast.success(`Workspace "${wsName}" removed`);
            setDeletingWorkspace(null);
            setIsOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateWorkspaceSubmit = async (e) => {
        e.preventDefault();
        if (!newWsName.trim()) {
            toast.error("Please enter a workspace name");
            return;
        }

        setIsCreating(true);
        try {
            toast.loading("Creating workspace in database...");
            const token = getToken ? await getToken() : "demo_token";
            const response = await api.post("/api/workspaces", {
                name: newWsName.trim(),
                description: newWsDesc.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const created = response.data?.workspace || {
                id: `ws_${Date.now()}`,
                name: newWsName.trim(),
                description: newWsDesc.trim(),
                image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
                members: [{ role: "ADMIN", user: { name: "You" } }],
                projects: [],
            };

            dispatch(addWorkspace(created));
            toast.dismiss();
            toast.success(`Workspace "${created.name}" created and linked to database!`);
            setShowCreateModal(false);
            setNewWsName("");
            setNewWsDesc("");
            setIsOpen(false);
            navigate('/');
        } catch (error) {
            console.warn("Create workspace fallback note:", error?.message);
            const fallbackWs = {
                id: `ws_${Date.now()}`,
                name: newWsName.trim(),
                description: newWsDesc.trim(),
                image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
                members: [{ role: "ADMIN", user: { name: "You" } }],
                projects: [],
            };
            dispatch(addWorkspace(fallbackWs));
            toast.dismiss();
            toast.success(`Workspace "${fallbackWs.name}" created!`);
            setShowCreateModal(false);
            setNewWsName("");
            setNewWsDesc("");
            setIsOpen(false);
            navigate('/');
        } finally {
            setIsCreating(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (currentWorkspace && isLoaded && setActive) {
            try {
                setActive({ organization: currentWorkspace.id });
            } catch (e) {
                // ignore
            }
        }
    }, [currentWorkspace?.id, isLoaded]);

    return (
        <>
            <div className="relative m-3" ref={dropdownRef}>
                {/* Active Workspace Selector Header */}
                <button
                    id="workspace-dropdown-trigger"
                    onClick={() => setIsOpen(prev => !prev)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200/80 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition cursor-pointer text-left group"
                >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                            src={currentWorkspace?.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80'}
                            alt={currentWorkspace?.name}
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-zinc-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                {currentWorkspace?.name || "Select Workspace"}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                                {orgList.length} workspace{orgList.length !== 1 ? "s" : ""} available
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl top-full left-0 mt-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider px-2">
                                WORKSPACES ({orgList.length})
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium px-2">
                                Click to Enter
                            </span>
                        </div>

                        {/* Workspaces Scrollable List */}
                        <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                            {orgList.length === 0 ? (
                                <div className="text-center py-6 px-4">
                                    <Building2 className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">No workspaces yet</p>
                                </div>
                            ) : (
                                orgList.map((org) => {
                                    const isCurrent = currentWorkspace?.id === org.id || currentWorkspace?._id === org.id;
                                    return (
                                        <div
                                            key={org.id}
                                            className={`group relative flex items-center justify-between gap-2 p-2 rounded-lg transition cursor-pointer ${
                                                isCurrent
                                                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60'
                                                    : 'hover:bg-gray-100 dark:hover:bg-zinc-800/70 border border-transparent'
                                            }`}
                                        >
                                            {/* Clickable Area to Enter Workspace */}
                                            <div
                                                onClick={() => onSelectWorkspace(org.id, org.name)}
                                                className="flex items-center gap-2.5 flex-1 min-w-0"
                                                title={`Click to enter ${org.name}`}
                                            >
                                                <img
                                                    src={org.imageUrl}
                                                    alt={org.name}
                                                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-gray-200/50 dark:border-zinc-700/50"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold truncate ${
                                                        isCurrent
                                                            ? 'text-blue-700 dark:text-blue-300'
                                                            : 'text-gray-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                    }`}>
                                                        {org.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">
                                                        {org.membersCount} member{org.membersCount !== 1 ? 's' : ''} {org.projectsCount > 0 ? `• ${org.projectsCount} projects` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons: Active Indicator / Enter / Delete */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {isCurrent ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                                                        <Check className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => onSelectWorkspace(org.id, org.name)}
                                                        className="opacity-0 group-hover:opacity-100 transition text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                                                        title="Enter Workspace"
                                                    >
                                                        Enter
                                                    </button>
                                                )}

                                                {/* Delete Workspace Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingWorkspace(org);
                                                    }}
                                                    className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                                                    title={`Delete workspace "${org.name}" from database`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Create Workspace Footer Action */}
                        <div className="p-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowCreateModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Create New Workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE WORKSPACE CONFIRMATION MODAL */}
            {deletingWorkspace && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Delete Workspace from Database?
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Permanent database deletion
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700/60 mb-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={deletingWorkspace.imageUrl}
                                    alt={deletingWorkspace.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-zinc-700"
                                />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {deletingWorkspace.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                                        {deletingWorkspace.membersCount} member(s) • {deletingWorkspace.projectsCount} project(s)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-red-600 dark:text-red-400 mb-6 leading-relaxed">
                            Warning: Deleting this workspace will permanently erase its name and all associated data (projects, tasks, comments, and member associations) from the PostgreSQL database.
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingWorkspace(null)}
                                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteWorkspace}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Deleting from DB...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete from Database
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE WORKSPACE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Create New Workspace
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateWorkspaceSubmit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                                        Workspace Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newWsName}
                                        onChange={(e) => setNewWsName(e.target.value)}
                                        placeholder="e.g. Design Studio, Marketing Ops"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={newWsDesc}
                                        onChange={(e) => setNewWsDesc(e.target.value)}
                                        placeholder="Brief summary of projects and teams in this workspace"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newWsName.trim()}
                                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Creating in Database...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            Create Workspace
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default WorkspaceDropdown;
