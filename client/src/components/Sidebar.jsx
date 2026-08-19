import { useEffect, useRef, useState } from 'react'
import WorkspaceDropdown from './WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, LogOut, SettingsIcon, UsersIcon } from 'lucide-react'
import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import { NavLink } from 'react-router-dom'
import { useAppClerk, useAppUser } from '../context/AppAuth'
import toast from 'react-hot-toast'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { signOut, openUserProfile } = useAppClerk()
    const { user } = useAppUser()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Team', href: '/team', icon: UsersIcon },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ]

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            toast.loading("Signing out...");
            if (signOut) {
                await signOut();
            }
            localStorage.setItem('demo_auth_active', 'false');
            toast.dismiss();
            toast.success("Signed out");
            window.location.href = "/sign-in";
        } catch (err) {
            console.warn("Sign out fallback redirect:", err);
            localStorage.setItem('demo_auth_active', 'false');
            toast.dismiss();
            window.location.href = "/sign-in";
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div ref={sidebarRef} className={`z-10 bg-white/95 dark:bg-zinc-950/80 dark:backdrop-blur-md min-w-68 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800/80 max-sm:absolute transition-all ${isSidebarOpen ? 'left-0' : '-left-full'} `} >
            <WorkspaceDropdown />
            <hr className='border-gray-200 dark:border-zinc-800/80' />
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col justify-between'>
                <div>
                    <div className='p-4'>
                        {menuItems.map((item) => (
                            <NavLink to={item.href} key={item.name} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 text-gray-800 dark:text-zinc-100 cursor-pointer rounded-lg transition-all  ${isActive ? 'bg-gray-100 dark:bg-zinc-800/80 dark:border dark:border-zinc-700/60 font-medium shadow-xs' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/40'}`} >
                                <item.icon size={16} />
                                <p className='text-sm truncate'>{item.name}</p>
                            </NavLink>
                        ))}
                    </div>
                    <MyTasksSidebar />
                    <ProjectSidebar />
                </div>

                {/* Bottom User & Sign Out section */}
                <div className="p-3 border-t border-gray-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 m-2 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                        <div
                            onClick={() => openUserProfile?.()}
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition"
                            title="Manage profile"
                        >
                            <img
                                src={user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                                alt="avatar"
                                className="size-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                    {user?.fullName || user?.firstName || "Account"}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate">
                                    {user?.primaryEmailAddress?.emailAddress || "Signed in"}
                                </p>
                            </div>
                        </div>

                        <button
                            id="sidebar-signout-btn"
                            title="Sign out"
                            disabled={isLoggingOut}
                            onClick={handleSignOut}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        >
                            <LogOut className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
