import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyUsers, dummyWorkspaces } from '../assets/assets';

// Demo State Context
const DemoAuthContext = createContext(null);

export const ClerkProvider = ({ children }) => {
    const [user, setUser] = useState({
        id: dummyUsers[0].id,
        fullName: dummyUsers[0].name,
        firstName: dummyUsers[0].name.split(' ')[0],
        lastName: dummyUsers[0].name.split(' ')[1] || '',
        emailAddresses: [{ emailAddress: dummyUsers[0].email, id: 'email_1' }],
        imageUrl: dummyUsers[0].image,
        role: 'admin',
        lastSignInAt: new Date(),
        update: async (data) => {
            setUser((prev) => ({
                ...prev,
                ...data,
                fullName: `${data.firstName || prev.firstName} ${data.lastName || prev.lastName}`.trim(),
            }));
            return true;
        },
    });

    const [activeWorkspaceId, setActiveWorkspaceId] = useState(
        (typeof window !== 'undefined' && localStorage.getItem('currentWorkspaceId')) || dummyWorkspaces[0].id
    );

    const [workspaces, setWorkspaces] = useState(
        dummyWorkspaces.map((ws) => ({
            id: ws.id,
            name: ws.name,
            imageUrl: ws.image_url,
            membersCount: ws.members.length,
        }))
    );

    const value = {
        user,
        setUser,
        isSignedIn: true,
        isLoaded: true,
        userId: user.id,
        getToken: async () => 'demo_token',
        workspaces,
        setWorkspaces,
        activeWorkspaceId,
        setActiveWorkspaceId,
    };

    return (
        <DemoAuthContext.Provider value={value}>
            {children}
        </DemoAuthContext.Provider>
    );
};

export const useUser = () => {
    const ctx = useContext(DemoAuthContext);
    if (!ctx) {
        return {
            isLoaded: true,
            isSignedIn: true,
            user: {
                id: dummyUsers[0].id,
                fullName: dummyUsers[0].name,
                firstName: dummyUsers[0].name.split(' ')[0],
                lastName: dummyUsers[0].name.split(' ')[1] || '',
                emailAddresses: [{ emailAddress: dummyUsers[0].email }],
                imageUrl: dummyUsers[0].image,
                role: 'admin',
                lastSignInAt: new Date(),
                update: async () => {},
            },
        };
    }
    return {
        isLoaded: ctx.isLoaded,
        isSignedIn: ctx.isSignedIn,
        user: ctx.user,
    };
};

export const useAuth = () => {
    const ctx = useContext(DemoAuthContext);
    return {
        isLoaded: true,
        isSignedIn: true,
        userId: ctx?.user?.id || dummyUsers[0].id,
        getToken: async () => 'demo_token',
    };
};

export const useClerk = () => {
    return {
        openUserProfile: () => {
            if (typeof window !== 'undefined') {
                window.location.hash = '';
                if (window.location.pathname !== '/settings') {
                    window.history.pushState({}, '', '/settings');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }
            }
        },
        openCreateOrganization: () => {},
        signOut: () => {
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        },
    };
};

export const useOrganization = () => {
    const ctx = useContext(DemoAuthContext);
    const activeWs = ctx?.workspaces?.find((w) => w.id === ctx?.activeWorkspaceId) || dummyWorkspaces[0];
    return {
        organization: {
            id: activeWs.id,
            name: activeWs.name,
            imageUrl: activeWs.imageUrl,
            inviteMember: async () => true,
        },
        isLoaded: true,
    };
};

export const useOrganizationList = (options) => {
    const ctx = useContext(DemoAuthContext);
    const list = ctx?.workspaces || dummyWorkspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        imageUrl: ws.image_url,
        membersCount: ws.members.length
    }));

    return {
        isLoaded: true,
        setActive: ({ organization }) => {
            if (organization && ctx?.setActiveWorkspaceId) {
                ctx.setActiveWorkspaceId(organization);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('currentWorkspaceId', organization);
                }
            }
        },
        userMemberships: {
            data: list.map((ws) => ({
                organization: {
                    id: ws.id,
                    name: ws.name,
                    imageUrl: ws.imageUrl || ws.image_url,
                    membersCount: ws.membersCount || 3,
                },
                role: 'org:admin',
            })),
        },
    };
};

export const UserButton = (props) => {
    const { user } = useUser();
    const handleClick = () => {
        if (typeof window !== 'undefined') {
            if (window.location.pathname !== '/settings') {
                window.history.pushState({}, '', '/settings');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        }
    };
    return (
        <div
            id="user-profile-btn"
            onClick={handleClick}
            title="User Profile & Settings"
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition shadow-xs"
        >
            <img
                src={user?.imageUrl || dummyUsers[0].image}
                alt={user?.fullName || 'User'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/20"
            />
            <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200 max-w-[100px] truncate">
                {user?.firstName || 'Alex'}
            </span>
        </div>
    );
};

export const OrganizationSwitcher = (props) => {
    const { organization } = useOrganization();
    return (
        <div id="organization-switcher" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-xs font-medium text-gray-800 dark:text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="truncate max-w-[140px] font-semibold">{organization?.name || 'Corp Workspace'}</span>
        </div>
    );
};

export const SignIn = (props) => {
    return (
        <div id="sign-in-panel" className="p-8 max-w-sm mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Signed in as Demo User</p>
            <button
                id="sign-in-submit"
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
            >
                Continue to Dashboard
            </button>
        </div>
    );
};

export const CreateOrganization = (props) => {
    return (
        <div id="create-org-panel" className="p-8 max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Workspace</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                Create a team workspace to start collaborating on projects.
            </p>
            <button
                id="create-org-submit"
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
            >
                Get Started
            </button>
        </div>
    );
};

export const SignedIn = ({ children }) => {
    return <>{children}</>;
};

export const SignedOut = ({ children }) => {
    return null;
};
