import React, { createContext, useContext, useState, useEffect } from 'react'
import { ClerkProvider, SignIn as ClerkSignIn, UserButton as ClerkUserButton, useUser as useClerkUser, useAuth as useClerkAuth, useClerk as useClerkClient } from '@clerk/clerk-react'
import { KeyRound, LogIn, ShieldCheck, UserCheck } from 'lucide-react'

// Demo context for testing when Clerk keys are dummy/not set
const DemoAuthContext = createContext({
    user: null,
    isLoaded: true,
    isSignedIn: false,
    loginAsDemo: () => {},
    logout: () => {},
})

export const useDemoAuth = () => useContext(DemoAuthContext)

const defaultDemoUser = {
    id: 'user_1',
    fullName: 'Alex Smith (Demo User)',
    firstName: 'Alex',
    lastName: 'Smith',
    imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    primaryEmailAddress: { emailAddress: 'alexsmith@example.com' },
    emailAddresses: [{ emailAddress: 'alexsmith@example.com' }],
    lastSignInAt: new Date().toISOString(),
}

export function DemoAuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('demo_user_logged_in')
        return saved === 'true' ? defaultDemoUser : null
    })

    const loginAsDemo = () => {
        localStorage.setItem('demo_user_logged_in', 'true')
        setUser(defaultDemoUser)
    }

    const logout = () => {
        localStorage.removeItem('demo_user_logged_in')
        setUser(null)
    }

    return (
        <DemoAuthContext.Provider
            value={{
                user,
                isLoaded: true,
                isSignedIn: !!user,
                loginAsDemo,
                logout,
            }}
        >
            {children}
        </DemoAuthContext.Provider>
    )
}

export function DemoSignIn() {
    const { loginAsDemo } = useDemoAuth()

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 w-full">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <KeyRound className="size-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Authentication</h2>
                        <p className="text-xs text-zinc-400">Sign in to your project workspace</p>
                    </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <ShieldCheck className="size-4" />
                        <span>Demo & Clerk Hybrid Mode Active</span>
                    </div>
                    <p className="text-zinc-400">
                        You can test all features instantly using Demo User, or plug in your live Clerk API keys in <code className="text-zinc-200">.env</code>.
                    </p>
                </div>

                <button
                    id="demo-login-btn"
                    onClick={loginAsDemo}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition cursor-pointer shadow-lg shadow-blue-500/20"
                >
                    <UserCheck className="size-4" />
                    Sign In as Demo User
                </button>

                <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-[11px] text-zinc-500 font-mono">
                    <p className="text-zinc-400 font-sans font-medium text-xs">Configure Real Clerk Authentication:</p>
                    <p className="text-blue-400">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</p>
                    <p className="text-emerald-400">CLERK_SECRET_KEY=sk_test_...</p>
                </div>
            </div>
        </div>
    )
}
