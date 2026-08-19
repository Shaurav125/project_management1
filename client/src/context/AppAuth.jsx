import React from 'react'
import {
    ClerkProvider as BaseClerkProvider,
    useUser,
    useAuth,
    useClerk,
    useOrganization,
    useOrganizationList,
    UserButton,
    SignIn,
    SignUp,
    CreateOrganization,
    OrganizationSwitcher,
    SignedIn,
    SignedOut
} from '@clerk/clerk-react'

export const PUBLISHABLE_KEY =
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    "pk_test_dW5pdGVkLXRocnVzaC04ODg3LmNsZXJrLmFjY291bnRzLmRldiQ"

export function AppAuthProvider({ children }) {
    if (!PUBLISHABLE_KEY) {
        throw new Error("Missing Clerk Publishable Key")
    }

    return (
        <BaseClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/sign-in">
            {children}
        </BaseClerkProvider>
    )
}

// Export official Clerk primitives and aliases
export {
    useUser,
    useAuth,
    useClerk,
    useOrganization,
    useOrganizationList,
    UserButton,
    SignIn,
    SignUp,
    CreateOrganization,
    OrganizationSwitcher,
    SignedIn,
    SignedOut,
}

// Backwards-compatible aliases
export const useAppUser = useUser
export const useAppAuth = useAuth
export const useAppClerk = useClerk
export const AppUserButton = UserButton
export const AppSignIn = SignIn
export const AppCreateOrganization = CreateOrganization
export const ClerkProvider = AppAuthProvider
