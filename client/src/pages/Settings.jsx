import { useEffect, useState } from "react";
import { UserIcon, Shield, Save, LogOut, Building2, Bell, Palette, CheckCircle2 } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { toggleTheme } from "../features/themeSlice";
import { updateWorkspace } from "../features/workspaceSlice";
import toast from "react-hot-toast";

export default function Settings() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const [profileData, setProfileData] = useState({ firstName: "", lastName: "" });
    const [workspaceData, setWorkspaceData] = useState({
        name: "",
        slug: "",
        description: "",
    });
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        taskAssigned: true,
        projectUpdates: true,
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

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

    const handleUpdateWorkspace = (e) => {
        e.preventDefault();
        if (!currentWorkspace) return;
        dispatch(
            updateWorkspace({
                ...currentWorkspace,
                name: workspaceData.name,
                slug: workspaceData.slug,
                description: workspaceData.description,
            })
        );
        toast.success("Workspace settings saved!");
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            signOut();
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
                    Manage your personal account, active workspace, and app preferences.
                </p>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-zinc-900/60 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-800/80 rounded-xl p-1.5 shadow-xs">
                    {[
                        { key: "profile", icon: <UserIcon className="w-4 h-4" />, label: "Profile" },
                        { key: "workspace", icon: <Building2 className="w-4 h-4" />, label: "Workspace" },
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
                                <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Workspace Settings</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Configure active organization preferences and details</p>
                            </div>

                            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
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
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-xs cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Workspace
                                </button>
                            </form>
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
                                <button
                                    id="logout-btn"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out of Session
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
