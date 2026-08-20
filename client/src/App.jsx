import { Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Team from './pages/Team'
import ProjectDetails from './pages/ProjectDetails'
import TaskDetails from './pages/TaskDetails'
import Settings from './pages/Settings'
import { SignIn, SignUp, CreateOrganization } from './context/AppAuth'

const App = () => {
    return (
        <>
            <Toaster />
            <Routes>
                <Route
                    path="/sign-in/*"
                    element={
                        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
                            <SignIn routing="hash" />
                        </div>
                    }
                />
                <Route
                    path="/sign-up/*"
                    element={
                        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
                            <SignUp routing="hash" />
                        </div>
                    }
                />
                <Route
                    path="/create-organization/*"
                    element={
                        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
                            <CreateOrganization routing="hash" />
                        </div>
                    }
                />
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projectsDetail" element={<ProjectDetails />} />
                    <Route path='taskDetails' element={<TaskDetails/>} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </>
    )
}

export default App