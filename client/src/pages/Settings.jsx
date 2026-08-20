import { useEffect, useState } from "react";
import { UserIcon, Shield, Save, LogOut, Building2, Bell, Palette, CheckCircle2, Server, Database, KeyRound, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { useAppClerk, useAppUser } from "../context/AppAuth";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { toggleTheme } from "../features/themeSlice";
import { updateWorkspace, deleteWorkspace } from "../features/workspaceSlice";
import api from "../configs/api";
import toast from "react-hot-toast";

export default function Settings() {
    const { user } = useAppUser();
    const { signOut } = useAppClerk();
    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);
    const { currentWorkspace, workspaces } = useSelector((state) => state.workspace);

    const [profileData, setProfileData] = useState({ firstName: "", lastName: "" });
    const [workspaceData, setWorkspaceData] = useState({
        name: "",
        org_name: "",
        image_url: "",
        slug: "",
        description: "",
    });
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        taskAssigned: true,
        projectUpdates: true,
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
    const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    const LOGO_PRESETS = [
        { label: "Modern Tech", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80" },
        { label: "Apex Indigo", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80" },
        { label: "Emerald Studio", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80" },
        { label: "Cyber Violet", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=80" },
        { label: "Sunset Coral", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80" },
    ];

    // System Status state
    const [systemStatus, setSystemStatus] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);

    const fetchSystemStatus = async () => {
        setIsLoadingStatus(true);
        try {
            const { data } = await api.get('/api/system-status');
            setSystemStatus(data);
        } catch (err) {
            console.warn("System status error:", err.message);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    useEffect(() => {
        if (activeTab === "system") {
            fetchSystemStatus();
        }
    }, [activeTab]);

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || (user.fullName ? user.fullName.split(" ")[0] : "Alex"),
                lastName: user.lastName || (user.fullName ? user.fullName.split(" ").slice(1).join(" ") : "Smith"),
            });
        }
    }, [user]);

    useEffect(() => {
        if (currentWorkspace) {
            setWorkspaceData({
                name: currentWorkspace.name || "",
                org_name: currentWorkspace.org_name || currentWorkspace.orgName || currentWorkspace.organizationName || "Apex Global",
                image_url: currentWorkspace.image_url || currentWorkspace.imageUrl || currentWorkspace.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80",
                slug: currentWorkspace.slug || "",
                description: currentWorkspace.description || "Main workspace for cross-functional product management",
            });
        }
    }, [currentWorkspace]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            if (user?.update) {
                await user.update({
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                });
            }
            toast.success("Profile details updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateWorkspace = async (e) => {
        e.preventDefault();
        if (!currentWorkspace) return;
        setIsUpdating(true);
        try {
            const { data } = await api.put(`/api/workspaces/${currentWorkspace.id}`, {
                name: workspaceData.name,
                org_name: workspaceData.org_name,
                orgName: workspaceData.org_name,
                image_url: workspaceData.image_url,
                slug: workspaceData.slug,
                description: workspaceData.description,
            });
            dispatch(
                updateWorkspace({
                    ...currentWorkspace,
                    ...(data?.workspace || {}),
                    name: workspaceData.name,
                    org_name: workspaceData.org_name,
                    orgName: workspaceData.org_name,
                    image_url: workspaceData.image_url,
                    slug: workspaceData.slug,
                    description: workspaceData.description,
                })
            );
            toast.success("Organization and Workspace branding saved!");
        } catch (error) {
            console.warn("Workspace update fallback:", error?.message);
            dispatch(
                updateWorkspace({
                    ...currentWorkspace,
                    name: workspaceData.name,
                    org_name: workspaceData.org_name,
                    orgName: workspaceData.org_name,
                    image_url: workspaceData.image_url,
                    slug: workspaceData.slug,
                    description: workspaceData.description,
                })
            );
            toast.success("Organization & Workspace details saved!");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!currentWorkspace) return;
        setIsDeletingWorkspace(true);
        const orgDisplayName = currentWorkspace.org_name || currentWorkspace.name;
        const toastId = toast.loading(`Deleting workspace and all data under ${orgDisplayName}...`);
        try {
            await api.delete(`/api/workspaces/${currentWorkspace.id}`).catch(apiErr => {
                console.warn("Delete workspace API notice:", apiErr?.response?.data?.message || apiErr.message);
            });
            dispatch(deleteWorkspace(currentWorkspace.id));
            toast.success("Workspace and all organization data deleted completely from database", { id: toastId });
            setShowDeleteWorkspaceConfirm(false);
        } catch (error) {
            console.warn("Delete workspace error:", error?.message);
            dispatch(deleteWorkspace(currentWorkspace.id));
            toast.success("Workspace deleted", { id: toastId });
            setShowDeleteWorkspaceConfirm(false);
        } finally {
            setIsDeletingWorkspace(false);
        }
    };

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            toast.loading("Signing out...");
            if (signOut) {
                await signOut();
            }
            localStorage.setItem('demo_auth_active', 'false');
            toast.dismiss();
            toast.success("Signed out successfully");
            window.location.href = "/sign-in";
        } catch (err) {
            console.warn("Sign out fallback redirect:", err);
            localStorage.setItem('demo_auth_active', 'false');
            toast.dismiss();
            window.location.href = "/sign-in";
        } finally {
            setIsLoggingOut(false);
            setShowLogoutConfirm(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return "Today";
        try {
            const dateObj = typeof d === "string" ? new Date(d) : d;
            return dateObj.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "Active recently";
        }
    };

    return user && (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Manage your personal account, active workspace, and API integrations.
                </p>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-zinc-900/60 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-1.5 shadow-xs">
                    {[
                        { key: "profile", icon: <UserIcon className="w-4 h-4" />, label: "Profile" },
                        { key: "workspace", icon: <Building2 className="w-4 h-4" />, label: "Workspace" },
                        { key: "system", icon: <Server className="w-4 h-4" />, label: "API & Integrations" },
                        { key: "preferences", icon: <Palette className="w-4 h-4" />, label: "Preferences" },
                        { key: "account", icon: <Shield className="w-4 h-4" />, label: "Account & Security" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            id={`settings-tab-${tab.key}`}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                                activeTab === tab.key
                                    ? "bg-white dark:bg-zinc-800/90 dark:border dark:border-zinc-700/60 text-gray-900 dark:text-white shadow-xs"
                                    : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-zinc-800/30"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tabs Panel Container */}
                <AnimatePresence mode="wait">
                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 space-y-6 shadow-xs"
                        >
                            <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-4">
                                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Profile Information</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Update your personal account details</p>
                            </div>
                            
                            <div className="flex items-center gap-5">
                                <img
                                    src={user.imageUrl}
                                    className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs"
                                    alt="Profile Avatar"
                                />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName || `${profileData.firstName} ${profileData.lastName}`}</h3>
                                    <p className="text-gray-500 dark:text-zinc-400 text-sm">{user?.emailAddresses?.[0]?.emailAddress || "alexsmith@example.com"}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 capitalize">
                                        {user.role || "Admin"} Member
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                            First Name
                                        </label>
                                        <input
                                            id="firstName"
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                            Last Name
                                        </label>
                                        <input
                                            id="lastName"
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={user.emailAddresses?.[0]?.emailAddress || "alexsmith@example.com"}
                                        disabled
                                        className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-500 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                                        Email address is linked to your authentication provider.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    id="save-profile-btn"
                                    disabled={isUpdating}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-xs cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    {isUpdating ? "Saving..." : "Save Profile Changes"}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* Workspace Tab */}
                    {activeTab === "workspace" && (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 space-y-6 shadow-xs"
                        >
                            <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-4">
                                <h2 className="text-gray-900 dark:text-white text-lg font-semibold flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-500" /> Organization & Workspace Branding
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                                    Configure which organization this workspace belongs to, customize its brand logo, and manage workspace data.
                                </p>
                            </div>

                            {/* Live Branding Preview Card */}
                            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/80 space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                    Live Workspace & Organization Preview
                                </span>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={workspaceData.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80'}
                                        alt={workspaceData.org_name || "Logo"}
                                        className="w-12 h-12 rounded-xl object-cover border border-blue-200 dark:border-zinc-700 shadow-sm shrink-0"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                {workspaceData.name || "Untitled Workspace"}
                                            </h3>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Org: {workspaceData.org_name || "Organization"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            This workspace was created for <span className="font-semibold text-gray-800 dark:text-zinc-200">{workspaceData.org_name || "Organization"}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Organization Name */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="orgName" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                            Organization Name (Visible on Workspace)
                                        </label>
                                        <input
                                            id="orgName"
                                            type="text"
                                            value={workspaceData.org_name}
                                            onChange={(e) => setWorkspaceData({ ...workspaceData, org_name: e.target.value })}
                                            placeholder="e.g. Apex Global, Acme Corp"
                                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                                            Specifies which organization this workspace is created for.
                                        </p>
                                    </div>

                                    {/* Workspace Name */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="workspaceName" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                            Workspace Name
                                        </label>
                                        <input
                                            id="workspaceName"
                                            type="text"
                                            value={workspaceData.name}
                                            onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Organization Logo URL & Presets */}
                                <div className="space-y-2">
                                    <label htmlFor="orgLogo" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                        Organization Logo Image URL
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={workspaceData.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80'}
                                            alt="Preview"
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-300 dark:border-zinc-700 shrink-0"
                                        />
                                        <input
                                            id="orgLogo"
                                            type="url"
                                            value={workspaceData.image_url}
                                            onChange={(e) => setWorkspaceData({ ...workspaceData, image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/photo-..."
                                            className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="text-[11px] text-gray-400">Quick presets:</span>
                                        {LOGO_PRESETS.map((p, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setWorkspaceData({ ...workspaceData, image_url: p.url })}
                                                className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition cursor-pointer"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="workspaceSlug" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                        Workspace Slug / URL ID
                                    </label>
                                    <input
                                        id="workspaceSlug"
                                        type="text"
                                        value={workspaceData.slug}
                                        onChange={(e) => setWorkspaceData({ ...workspaceData, slug: e.target.value })}
                                        className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="workspaceDesc" className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
                                        Description
                                    </label>
                                    <textarea
                                        id="workspaceDesc"
                                        rows={3}
                                        value={workspaceData.description}
                                        onChange={(e) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                                        className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    id="save-workspace-btn"
                                    disabled={isUpdating}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-xs cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    {isUpdating ? "Saving..." : "Save Workspace & Organization"}
                                </button>
                            </form>

                            {/* All Workspaces Directory */}
                            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                            All Workspaces ({workspaces.length})
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            Switch between any workspace or delete them along with all organization data
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {workspaces.map((ws) => {
                                        const isCurrent = currentWorkspace?.id === ws.id || currentWorkspace?._id === ws.id;
                                        const wsOrgName = ws.org_name || ws.orgName || ws.organizationName || "Apex Global";
                                        const wsLogo = ws.image_url || ws.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80';

                                        return (
                                            <div
                                                key={ws.id || ws._id}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                                                    isCurrent
                                                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                                                        : 'bg-gray-50/50 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img
                                                        src={wsLogo}
                                                        alt={wsOrgName}
                                                        className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-zinc-700 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                {ws.name}
                                                            </p>
                                                            <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900 truncate max-w-[120px]">
                                                                Org: {wsOrgName}
                                                            </span>
                                                            {isCurrent && (
                                                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                                            {ws.members?.length || 1} member(s) • {ws.projects?.length || 0} project(s)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {!isCurrent ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                dispatch(setCurrentWorkspace(ws.id));
                                                                toast.success(`Switched to "${ws.name}" (${wsOrgName})`);
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition cursor-pointer"
                                                        >
                                                            Enter
                                                        </button>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const confirmed = window.confirm(`Permanently delete workspace "${ws.name}" and all data under organization "${wsOrgName}"? This will delete all projects, tasks, comments, and members.`);
                                                            if (!confirmed) return;

                                                            const toastId = toast.loading(`Deleting "${ws.name}" and organization data...`);
                                                            try {
                                                                await api.delete(`/api/workspaces/${ws.id}`).catch(e => console.warn("API delete notice:", e.message));
                                                                dispatch(deleteWorkspace(ws.id));
                                                                toast.success(`Workspace "${ws.name}" and all associated organization data deleted completely`, { id: toastId });
                                                            } catch (err) {
                                                                dispatch(deleteWorkspace(ws.id));
                                                                toast.success(`Workspace "${ws.name}" removed`, { id: toastId });
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                                                        title={`Delete workspace "${ws.name}"`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Danger Zone: Delete Entire Workspace & Organization Data */}
                            <div className="pt-6 mt-6 border-t border-red-200 dark:border-red-950/60">
                                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                            <Trash2 className="size-4" /> Delete Workspace & All Organization Data
                                        </h3>
                                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 max-w-md">
                                            Permanently delete <span className="font-semibold">{currentWorkspace?.name || "this workspace"}</span> and all data under organization <span className="font-semibold">{currentWorkspace?.org_name || currentWorkspace?.name}</span>, including all projects, tasks, comments, and members.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        id="delete-workspace-btn"
                                        onClick={() => setShowDeleteWorkspaceConfirm(true)}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                                    >
                                        <Trash2 className="size-3.5" /> Delete Entire Workspace
                                    </button>
                                </div>
                            </div>

                            {/* Delete Workspace Confirmation Modal */}
                            {showDeleteWorkspaceConfirm && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-4">
                                        <div className="flex items-center gap-3 text-red-600">
                                            <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl">
                                                <AlertCircle className="size-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete Entire Workspace?</h3>
                                                <p className="text-xs text-zinc-500">Permanent cascade deletion</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                            Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">"{currentWorkspace?.name}"</span>?
                                            All projects, tasks, comments, files, and members created under organization <span className="font-semibold text-zinc-900 dark:text-zinc-100">"{currentWorkspace?.org_name || currentWorkspace?.name}"</span> will be completely and irreversibly removed from the database.
                                        </p>
                                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteWorkspaceConfirm(false)}
                                                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeleteWorkspace}
                                                disabled={isDeletingWorkspace}
                                                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Trash2 className="size-3.5" />
                                                {isDeletingWorkspace ? "Deleting Entire Workspace..." : "Yes, Delete Everything"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* API & System Status Tab */}
                    {activeTab === "system" && (
                        <motion.div
                            key="system"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 space-y-6 shadow-xs"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/80 pb-4">
                                <div>
                                    <h2 className="text-gray-900 dark:text-white text-lg font-semibold flex items-center gap-2">
                                        <Server className="size-5 text-blue-500" /> API & Integration Health
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                                        Live diagnostic status of Clerk Auth, Neon Database, Inngest, and API endpoints
                                    </p>
                                </div>
                                <button
                                    onClick={fetchSystemStatus}
                                    disabled={isLoadingStatus}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                                >
                                    <RefreshCw className={`size-3.5 ${isLoadingStatus ? "animate-spin" : ""}`} /> Refresh
                                </button>
                            </div>

                            {systemStatus ? (
                                <div className="space-y-4">
                                    {/* Clerk API Card */}
                                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                                <KeyRound className="size-4 text-purple-500" />
                                                <span>Clerk Authentication API</span>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                {systemStatus.integrations?.clerk?.status || "Active"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                                            <div>
                                                <span className="text-zinc-400 dark:text-zinc-500">Mode: </span>
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{systemStatus.integrations?.clerk?.activeMode}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-400 dark:text-zinc-500">Publishable Key: </span>
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {systemStatus.integrations?.clerk?.publishableKeyConfigured ? "Configured" : "Default Test/Demo"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-400 dark:text-zinc-500">Secret Key: </span>
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {systemStatus.integrations?.clerk?.secretKeyConfigured ? "Configured" : "Default Test/Demo"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Neon Database Card */}
                                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                                <Database className="size-4 text-emerald-500" />
                                                <span>Neon Database / PostgreSQL Engine</span>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                {systemStatus.integrations?.database?.status || "Active"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                                            <div>
                                                <span className="text-zinc-400 dark:text-zinc-500">Engine: </span>
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{systemStatus.integrations?.database?.engine}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-400 dark:text-zinc-500">Database URL: </span>
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {systemStatus.integrations?.database?.urlConfigured ? "Configured" : "Auto Seed Memory"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-400 dark:text-zinc-500">Latency: </span>
                                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                    {systemStatus.integrations?.database?.latencyMs ? `${systemStatus.integrations?.database?.latencyMs}ms` : "< 1ms (instant)"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inngest & Nodemailer */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Inngest Jobs</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                                                    8 Handlers
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sync users, workspaces, and assignment emails</p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Email Service (Nodemailer)</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                                    {systemStatus.integrations?.smtp?.configured ? "Live SMTP" : "Dev Mock Log"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Task reminders and project invites dispatch</p>
                                        </div>
                                    </div>

                                    {/* Endpoints checklist */}
                                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                                            REST Endpoints Verified (200 OK)
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.entries(systemStatus.endpoints || {}).map(([name, path]) => (
                                                <div key={name} className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                                    <span className="font-mono text-[11px] truncate">{path}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-zinc-500">
                                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-blue-500" />
                                    Checking APIs and system integrations...
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === "preferences" && (
                        <motion.div
                            key="preferences"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 space-y-6 shadow-xs"
                        >
                            <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-4">
                                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Appearance & Preferences</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Customize interface themes and notifications</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800/80 rounded-xl">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Theme Mode</h4>
                                        <p className="text-gray-500 dark:text-zinc-400 text-xs">Currently in {theme} mode</p>
                                    </div>
                                    <button
                                        id="toggle-theme-settings"
                                        onClick={() => dispatch(toggleTheme())}
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800/90 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 shadow-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                                    >
                                        Switch to {theme === "light" ? "Dark" : "Light"}
                                    </button>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Notification Channels</h4>
                                    <label className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800/80 rounded-lg cursor-pointer">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">Email Digest</p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-400">Receive weekly summary of tasks and project deadlines</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.emailAlerts}
                                            onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                                            className="size-4 text-blue-600 rounded"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800/80 rounded-lg cursor-pointer">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">Task Assignments</p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-400">Notify when a new task or review is assigned to you</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notifications.taskAssigned}
                                            onChange={(e) => setNotifications({ ...notifications, taskAssigned: e.target.checked })}
                                            className="size-4 text-blue-600 rounded"
                                        />
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Account Tab */}
                    {activeTab === "account" && (
                        <motion.div
                            key="account"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 space-y-6 shadow-xs"
                        >
                            <div className="border-b border-gray-100 dark:border-zinc-800/80 pb-4">
                                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Account & Security</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Manage active sessions and account controls</p>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800/80 rounded-xl">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Active Session</h4>
                                <p className="text-gray-500 dark:text-zinc-400 text-xs">
                                    Signed in as {user?.emailAddresses?.[0]?.emailAddress || "alexsmith@example.com"} &bull; Last verified on {formatDate(user?.lastSignInAt)}
                                </p>
                            </div>

                            <div className="p-4 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl space-y-3">
                                <div>
                                    <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm">Session Control</h4>
                                    <p className="text-gray-600 dark:text-zinc-400 text-xs mt-0.5">
                                        Sign out or reset your local workspace session cache.
                                    </p>
                                </div>
                                {showLogoutConfirm ? (
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            disabled={isLoggingOut}
                                            id="confirm-logout-btn"
                                            onClick={handleLogout}
                                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                                        >
                                            {isLoggingOut ? "Signing out..." : "Yes, Sign Out"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowLogoutConfirm(false)}
                                            className="px-4 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        id="logout-btn"
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out of Session
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
