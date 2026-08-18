import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import StatsGrid from '../components/StatsGrid'
import ProjectOverview from '../components/ProjectOverview'
import RecentActivity from '../components/RecentActivity'
import TasksSummary from '../components/TasksSummary'
import CreateProjectDialog from '../components/CreateProjectDialog'

const Dashboard = () => {
    const { user } = useUser()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        <div className='max-w-6xl mx-auto space-y-6'>
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
            >
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Welcome back, {user?.fullName || user?.firstName || 'Alex'}
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        Here's what's happening with your projects today
                    </p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDialogOpen(true)}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xs hover:opacity-95 transition cursor-pointer"
                >
                    <Plus size={16} /> New Project
                </motion.button>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </motion.div>

            <StatsGrid />

            <div className="grid lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="lg:col-span-2 space-y-8"
                >
                    <ProjectOverview />
                    <RecentActivity />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                >
                    <TasksSummary />
                </motion.div>
            </div>
        </div>
    )
}

export default Dashboard
