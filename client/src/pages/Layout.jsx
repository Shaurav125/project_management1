import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppAuth, useAppUser, AppSignIn, AppCreateOrganization } from '../context/AppAuth'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkspaces } from '../features/workspaceSlice'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { user, isLoaded } = useAppUser()
    const { workspaces, loading } = useSelector((state) => state.workspace)
    const { getToken } = useAppAuth()
    const dispatch = useDispatch()
    const location = useLocation()

    // Initial load of theme
    useEffect(() => {
        dispatch(loadTheme())
    }, [])

    // Initial load of workspaces
    useEffect(() => {
        if (isLoaded && user) {
            dispatch(fetchWorkspaces({ getToken }))
        }
    }, [user, isLoaded])

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-zinc-100 dark:bg-zinc-950 p-4">
                <AppSignIn routing="hash" />
            </div>
        )
    }

    if (loading) return (
        <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
            <Loader2Icon className="size-7 text-blue-500 animate-spin" />
        </div>
    )

    if (user && workspaces.length === 0) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-zinc-100 dark:bg-zinc-950 p-4">
                <AppCreateOrganization routing="hash" />
            </div>
        )
    }

    return (
        <div className="flex bg-white dark:bg-zinc-950 dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(0,0,0,0))] text-gray-900 dark:text-slate-100 min-h-screen">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-auto animate-in fade-in duration-200">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout
