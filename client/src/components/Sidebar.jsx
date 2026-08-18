import { useEffect, useRef } from 'react'
import WorkspaceDropdown from './WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, MoonIcon, SettingsIcon, SunIcon, UsersIcon } from 'lucide-react'
import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import { NavLink } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {

    const { openUserProfile } = useClerk()

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

    return (
        <div ref={sidebarRef} className={`z-10 bg-white/95 dark:bg-zinc-950/80 dark:backdrop-blur-md min-w-68 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800/80 max-sm:absolute transition-all ${isSidebarOpen ? 'left-0' : '-left-full'} `} >
            <WorkspaceDropdown />
            <hr className='border-gray-200 dark:border-zinc-800/80' />
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
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
            </div>
        </div>
    )
}

export default Sidebar
