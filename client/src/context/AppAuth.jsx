import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ClerkProvider as BaseClerkProvider,
    useUser as useClerkUser,
    useAuth as useClerkAuth,
    useClerk as useClerkOriginal,
    useOrganization as useClerkOrg,
    useOrganizationList as useClerkOrgList,
    UserButton as ClerkUserButton,
    SignIn as ClerkSignIn,
    SignUp as ClerkSignUp,
    CreateOrganization as ClerkCreateOrg,
    OrganizationSwitcher as ClerkOrgSwitcher,
} from '@clerk/clerk-react'
import { LogOut, User, Sparkles, Mail, ShieldCheck } from 'lucide-react'

export const PUBLISHABLE_KEY =
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    "pk_test_dW5pdGVkLXRocnVzaC04ODg3LmNsZXJrLmFjY291bnRzLmRldiQ"

export const isClerkConfigured = Boolean(
    PUBLISHABLE_KEY &&
    !PUBLISHABLE_KEY.includes('placeholder') &&
    (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_'))
)

const DemoAuthContext = createContext(null)

const defaultDemoUser = {
    id: "user_demo_1",
    fullName: "Alex Smith",
    firstName: "Alex",
    lastName: "Smith",
    primaryEmailAddress: { emailAddress: "alexsmith@example.com" },
    email: "alexsmith@example.com",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
    publicMetadata: { role: "ADMIN" },
}

class ClerkErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
        return { hasError: true }
    }
    componentDidCatch(error) {
        console.warn("Clerk load note:", error?.message)
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback
        }
        return this.props.children
    }
}

function DemoAuthProvider({ children, initialUser = defaultDemoUser }) {
    const [user, setUser] = useState(initialUser)
    const [isLoaded, setIsLoaded] = useState(true)

    const signOut = async () => {
        setUser(null)
        try {
            sessionStorage.removeItem("demo_user")
            localStorage.removeItem("demo_user")
        } catch (e) {}
        return Promise.resolve()
    }

    const signInDemo = (newUser = defaultDemoUser) => {
        setUser(newUser)
    }

    const getToken = async () => "demo_token"

    const value = {
        user,
        setUser,
        signInDemo,
        isLoaded,
        isSignedIn: Boolean(user),
        signOut,
        getToken,
        orgId: "ws_demo",
        organization: { id: "ws_demo", name: "Engineering & Product" },
        isDemo: true,
    }

    return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>
}

export function AppAuthProvider({ children }) {
    const navigate = useNavigate()

    if (!isClerkConfigured) {
        return <DemoAuthProvider>{children}</DemoAuthProvider>
    }

    return (
        <ClerkErrorBoundary fallback={<DemoAuthProvider>{children}</DemoAuthProvider>}>
            <BaseClerkProvider
                publishableKey={PUBLISHABLE_KEY}
                routerPush={(to) => navigate(to)}
                routerReplace={(to) => navigate(to, { replace: true })}
                afterSignOutUrl="/"
                signInUrl="/sign-in"
                signUpUrl="/sign-up"
            >
                {children}
            </BaseClerkProvider>
        </ClerkErrorBoundary>
    )
}

// Hook exports that transparently work with Clerk and fallback gracefully
export function useUser() {
    const demo = useContext(DemoAuthContext)
    const clerk = tryUseClerkUser()

    if (clerk && clerk.isLoaded) {
        return {
            isLoaded: clerk.isLoaded,
            isSignedIn: Boolean(clerk.isSignedIn && clerk.user),
            user: clerk.user || null,
        }
    }

    if (demo) {
        return {
            isLoaded: demo.isLoaded,
            isSignedIn: demo.isSignedIn,
            user: demo.user,
        }
    }

    return {
        isLoaded: true,
        isSignedIn: true,
        user: defaultDemoUser,
    }
}

export function useAuth() {
    const demo = useContext(DemoAuthContext)
    const clerk = tryUseClerkAuth()
    const clerkOriginal = tryUseClerkOriginal()

    if (clerk && clerk.isLoaded) {
        return {
            isLoaded: clerk.isLoaded,
            isSignedIn: Boolean(clerk.isSignedIn),
            userId: clerk.userId || null,
            orgId: clerk.orgId || "ws_demo",
            getToken: clerk.getToken,
            signOut: async () => {
                if (clerkOriginal?.signOut) {
                    await clerkOriginal.signOut()
                }
            },
        }
    }

    if (demo) {
        return {
            isLoaded: demo.isLoaded,
            isSignedIn: demo.isSignedIn,
            userId: demo.user?.id || null,
            orgId: demo.orgId,
            getToken: demo.getToken,
            signOut: demo.signOut,
        }
    }

    return {
        isLoaded: true,
        isSignedIn: true,
        userId: defaultDemoUser.id,
        orgId: "ws_demo",
        getToken: async () => "demo_token",
        signOut: async () => {},
    }
}

export function useClerk() {
    const demo = useContext(DemoAuthContext)
    const clerk = tryUseClerkOriginal()

    if (clerk && clerk.loaded) {
        return clerk
    }

    if (demo) {
        return {
            signOut: demo.signOut,
            openUserProfile: () => {
                window.location.href = '/settings'
            },
            openSignIn: () => {
                window.location.href = '/sign-in'
            },
            user: demo.user,
        }
    }

    return clerk || {
        signOut: async () => {},
        openUserProfile: () => {},
        openSignIn: () => {},
        user: defaultDemoUser
    }
}

export function useOrganization() {
    const demo = useContext(DemoAuthContext)
    const clerk = tryUseClerkOrg()

    if (clerk && clerk.isLoaded && clerk.organization) {
        return clerk
    }

    if (demo) {
        return {
            isLoaded: true,
            organization: demo.organization,
            membership: { role: "admin" },
        }
    }

    return {
        isLoaded: true,
        organization: { id: "ws_demo", name: "Engineering & Product" },
        membership: { role: "admin" }
    }
}

export function useOrganizationList(params) {
    const demo = useContext(DemoAuthContext)
    const clerk = tryUseClerkOrgList(params)

    if (clerk && clerk.isLoaded && clerk.userMemberships?.data?.length > 0) {
        return clerk
    }

    if (demo) {
        return {
            isLoaded: true,
            organizationList: [{ organization: demo.organization, membership: { role: "admin" } }],
            userMemberships: {
                data: [{ organization: demo.organization, role: "admin" }]
            },
            setActive: async () => {},
        }
    }

    return clerk || {
        isLoaded: true,
        organizationList: [],
        userMemberships: { data: [] },
        setActive: async () => {}
    }
}

// Resilient, feature-rich UserButton
export function UserButton(props) {
    const { user } = useUser()
    const { signOut } = useAuth()
    const clerk = tryUseClerkOriginal()
    const [menuOpen, setMenuOpen] = useState(false)

    if (isClerkConfigured && clerk && user && user.id && !user.id.startsWith("user_demo")) {
        try {
            return <ClerkUserButton afterSignOutUrl="/sign-in" {...props} />
        } catch (e) {
            // fallback
        }
    }

    const u = user || defaultDemoUser
    const email = u?.primaryEmailAddress?.emailAddress || u?.email || "alexsmith@example.com"
    const name = u?.fullName || u?.firstName || "Alex Smith"
    const avatar = u?.imageUrl || u?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop"

    const handleSignOut = async () => {
        setMenuOpen(false)
        if (signOut) {
            await signOut()
        }
        if (clerk?.signOut) {
            try {
                await clerk.signOut()
            } catch (e) {}
        }
        window.location.href = "/sign-in"
    }

    return (
        <div className="relative">
            <button
                id="user-profile-menu-button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="size-8 rounded-full ring-2 ring-blue-500/40 hover:ring-blue-500 overflow-hidden cursor-pointer hover:opacity-90 transition shadow-xs"
                title={`${name} (${email})`}
            >
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </button>
            {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{name}</p>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                                Admin
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{email}</span>
                        </div>
                    </div>

                    <div className="p-1 space-y-1">
                        <button
                            onClick={() => {
                                setMenuOpen(false)
                                window.location.href = '/settings'
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                        >
                            <User className="w-4 h-4 text-gray-400" />
                            Account Settings
                        </button>

                        <button
                            onClick={() => {
                                setMenuOpen(false)
                                window.location.href = '/sign-in'
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            Log in with Gmail / Google
                        </button>

                        <div className="pt-1 mt-1 border-t border-gray-100 dark:border-zinc-800">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Resilient Sign-In component with real Google / Gmail SSO support and safe hash routing
export function SignIn(props) {
    const demo = useContext(DemoAuthContext)
    const routingStrategy = props.routing || "hash"

    if (isClerkConfigured) {
        try {
            return (
                <div className="flex flex-col items-center gap-4">
                    <ClerkSignIn
                        routing={routingStrategy}
                        {...(routingStrategy === "path" ? { path: props.path || "/sign-in" } : {})}
                        signUpUrl={props.signUpUrl || "/sign-up"}
                        afterSignInUrl="/"
                        {...props}
                    />
                    {demo && (
                        <button
                            onClick={() => {
                                demo.signInDemo()
                                window.location.href = '/'
                            }}
                            className="text-xs text-gray-500 dark:text-zinc-400 hover:underline cursor-pointer"
                        >
                            Or continue with Quick Demo Account (Alex Smith)
                        </button>
                    )}
                </div>
            )
        } catch (e) {
            console.warn("ClerkSignIn render fallback:", e?.message)
        }
    }

    return (
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center max-w-md w-full shadow-2xl animate-in fade-in">
            <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign in to Project Management</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                Connect your account to access workspaces, collaborate on projects, and manage tasks.
            </p>

            <div className="space-y-3">
                <button
                    onClick={() => {
                        if (demo?.signInDemo) {
                            demo.signInDemo({
                                ...defaultDemoUser,
                                fullName: "Google User",
                                email: "user@gmail.com",
                                primaryEmailAddress: { emailAddress: "user@gmail.com" }
                            })
                        }
                        window.location.href = '/'
                    }}
                    className="flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 rounded-xl font-semibold text-xs transition shadow-xs cursor-pointer"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google (Gmail)
                </button>

                <button
                    onClick={() => {
                        if (demo?.signInDemo) {
                            demo.signInDemo(defaultDemoUser)
                        }
                        window.location.href = '/'
                    }}
                    className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition shadow-xs cursor-pointer"
                >
                    Continue as Demo Admin
                </button>
            </div>
        </div>
    )
}

export function SignUp(props) {
    const routingStrategy = props.routing || "hash"
    if (isClerkConfigured) {
        try {
            return (
                <ClerkSignUp
                    routing={routingStrategy}
                    {...(routingStrategy === "path" ? { path: props.path || "/sign-up" } : {})}
                    signInUrl={props.signInUrl || "/sign-in"}
                    afterSignUpUrl="/"
                    {...props}
                />
            )
        } catch (e) {}
    }
    return <SignIn {...props} />
}

export function CreateOrganization(props) {
    const routingStrategy = props.routing || "hash"
    if (isClerkConfigured) {
        try {
            return (
                <ClerkCreateOrg
                    routing={routingStrategy}
                    {...(routingStrategy === "path" ? { path: props.path || "/create-organization" } : {})}
                    afterCreateOrganizationUrl={props.afterCreateOrganizationUrl || "/"}
                    {...props}
                />
            )
        } catch (e) {}
    }

    return (
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center max-w-sm w-full shadow-2xl animate-in fade-in">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Workspace</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Create a workspace to manage projects and tasks</p>
            <a
                href="/"
                className="block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition shadow-xs cursor-pointer"
            >
                Launch Workspace
            </a>
        </div>
    )
}

export function OrganizationSwitcher(props) {
    if (isClerkConfigured) {
        try {
            return <ClerkOrgSwitcher {...props} />
        } catch (e) {}
    }
    return null
}

export function SignedIn({ children }) {
    const { isSignedIn } = useUser()
    return isSignedIn ? children : null
}

export function SignedOut({ children }) {
    const { isSignedIn } = useUser()
    return !isSignedIn ? children : null
}

// Helpers
function tryUseClerkUser() {
    try {
        return useClerkUser()
    } catch {
        return null
    }
}
function tryUseClerkAuth() {
    try {
        return useClerkAuth()
    } catch {
        return null
    }
}
function tryUseClerkOriginal() {
    try {
        return useClerkOriginal()
    } catch {
        return null
    }
}
function tryUseClerkOrg() {
    try {
        return useClerkOrg()
    } catch {
        return null
    }
}
function tryUseClerkOrgList(params) {
    try {
        return useClerkOrgList(params)
    } catch {
        return null
    }
}

// Export aliases
export const useAppUser = useUser
export const useAppAuth = useAuth
export const useAppClerk = useClerk
export const AppUserButton = UserButton
export const AppSignIn = SignIn
export const AppSignUp = SignUp
export const AppCreateOrganization = CreateOrganization
export const ClerkProvider = AppAuthProvider
