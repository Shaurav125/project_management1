import { SearchIcon, PanelLeft, Building2 } from 'lucide-react'
import { UserButton } from '../context/AppAuth'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const { theme } = useSelector(state => state.theme);
    const currentWorkspace = useSelector(state => state.workspace?.currentWorkspace);

    const orgName = currentWorkspace?.org_name || currentWorkspace?.orgName || currentWorkspace?.organizationName || "Apex Global";
    const orgLogo = currentWorkspace?.image_url || currentWorkspace?.imageUrl || currentWorkspace?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80';

    return (
        <div className="w-full bg-white/90 dark:bg-zinc-950/75 dark:backdrop-blur-md border-b border-gray-200 dark:border-zinc-800/80 px-4 sm:px-6 xl:px-16 py-2.5 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto gap-4">
                {/* Left section */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0" >
                        <PanelLeft size={20} />
                    </button>

                    {/* Organization & Workspace Badge */}
                    {currentWorkspace && (
                        <Link
                            to="/settings"
                            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50/80 dark:bg-zinc-900/80 border border-gray-200/80 dark:border-zinc-800 text-xs text-gray-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-800 transition shrink-0 group"
                            title={`Organization: ${orgName} | Workspace: ${currentWorkspace.name}`}
                        >
                            <img
                                src={orgLogo}
                                alt={orgName}
                                className="w-5 h-5 rounded-md object-cover border border-gray-200 dark:border-zinc-700 shrink-0"
                            />
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate max-w-[140px]">
                                    {orgName}
                                </span>
                                <span className="text-gray-400 dark:text-zinc-500">•</span>
                                <span className="text-gray-500 dark:text-zinc-400 truncate max-w-[120px]">
                                    {currentWorkspace.name}
                                </span>
                            </div>
                        </Link>
                    )}

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-xs sm:max-w-sm">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="pl-8 pr-4 py-1.5 sm:py-2 w-full bg-white dark:bg-zinc-900/70 dark:backdrop-blur-sm border border-gray-300 dark:border-zinc-700/70 rounded-md text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800/80 dark:backdrop-blur-sm dark:border dark:border-zinc-700/50 shadow rounded-lg transition hover:scale-105 active:scale-95 cursor-pointer">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>
            </div>
        </div>
    )
}

export default Navbar

