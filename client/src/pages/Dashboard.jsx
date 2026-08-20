import { Plus, Building2, Sparkles, Settings as SettingsIcon, Users, FolderKanban } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAppUser } from '../context/AppAuth'
import StatsGrid from '../components/StatsGrid'
import ProjectOverview from '../components/ProjectOverview'
import RecentActivity from '../components/RecentActivity'
import TasksSummary from '../components/TasksSummary'
import CreateProjectDialog from '../components/CreateProjectDialog'

const Dashboard = () => {
    const { user } = useAppUser()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const currentWorkspace = useSelector(state => state.workspace?.currentWorkspace)

    const orgName = currentWorkspace?.org_name || currentWorkspace?.orgName || currentWorkspace?.organizationName || "Apex Global"
    const orgLogo = currentWorkspace?.image_url || currentWorkspace?.imageUrl || currentWorkspace?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80'
    const memberCount = currentWorkspace?.members?.length || 1
    const projectCount = currentWorkspace?.projects?.length || 0

    return (
        <div className='max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300'>
            {/* Organization & Workspace Identity Banner */}
            {currentWorkspace && (
                <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/80 p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={orgLogo}
                                alt={orgName}
                                className="w-12 h-12 rounded-xl object-cover border border-blue-200 dark:border-zinc-700 shadow-sm shrink-0 ring-2 ring-white dark:ring-zinc-800"
                            />
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {currentWorkspace.name}
                                    </h2>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                        <Building2 className="w-3 h-3" /> Org: {orgName}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                                    Workspace created for <span className="font-semibold text-gray-900 dark:text-zinc-200">{orgName}</span> • {currentWorkspace.description || "Active collaboration workspace"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <div className="hidden lg:flex items-center gap-3 mr-2 text-xs text-gray-500 dark:text-zinc-400">
                                <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-gray-400" /> {memberCount} member{memberCount !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FolderKanban className="w-3.5 h-3.5 text-gray-400" /> {projectCount} project{projectCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <Link
                                to="/settings"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
                            >
                                <SettingsIcon className="w-3.5 h-3.5" /> Org Settings
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Welcome back, {user?.fullName || user?.firstName || 'Alex'}
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        Here's what's happening with your projects today
                    </p>
                </div>

                <button
                    onClick={() => setIsDialogOpen(true)}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xs hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                    <Plus size={16} /> New Project
                </button>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            <StatsGrid />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ProjectOverview />
                    <RecentActivity />
                </div>
                <div>
                    <TasksSummary />
                </div>
            </div>
        </div>
    )
}

export default Dashboard
