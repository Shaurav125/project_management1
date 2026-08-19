import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";
import { useClerk, useOrganizationList } from "../context/AppAuth";

function WorkspaceDropdown() {

    const { setActive, userMemberships, isLoaded } = useOrganizationList({ userMemberships: true });

    const { openCreateOrganization } = useClerk()

    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleCreateWorkspace = () => {
        setIsOpen(false);
        if (openCreateOrganization) {
            try {
                openCreateOrganization();
                return;
            } catch (e) {
                // fallback to navigate
            }
        }
        navigate('/create-organization');
    };

    const orgList = (userMemberships?.data && userMemberships.data.length > 0)
        ? userMemberships.data.map(({ organization }) => ({
            id: organization.id,
            name: organization.name,
            imageUrl: organization.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80',
            membersCount: organization.membersCount || 1,
        }))
        : workspaces.map((ws) => ({
            id: ws.id,
            name: ws.name,
            imageUrl: ws.image_url || ws.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80',
            membersCount: ws.members?.length || 1,
        }));

    const onSelectWorkspace = (organizationId) => {
        if (setActive) {
            try {
                setActive({ organization: organizationId });
            } catch (e) {
                // ignore
            }
        }
        dispatch(setCurrentWorkspace(organizationId));
        setIsOpen(false);
        navigate('/');
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (currentWorkspace && isLoaded) {
            setActive({organization:currentWorkspace.id});
        }
    }, [currentWorkspace, isLoaded]);

    return (
        <div className="relative m-4" ref={dropdownRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800" >
                <div className="flex items-center gap-3">
                    <img src={currentWorkspace?.image_url} alt={currentWorkspace?.name} className="w-8 h-8 rounded shadow" />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {currentWorkspace?.name || "Select Workspace"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900/95 dark:backdrop-blur-md border border-gray-200 dark:border-zinc-700/80 rounded-xl shadow-xl top-full left-0 overflow-hidden">
                    <div className="p-2">
                        <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2 font-medium">
                            Workspaces
                        </p>
                        {orgList.map((organization) => (
                            <div key={organization.id} onClick={() => onSelectWorkspace(organization.id)} className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition" >
                                <img src={organization.imageUrl} alt={organization.name} className="w-6 h-6 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                        {organization.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                        {organization.membersCount || 0} members
                                    </p>
                                </div>
                                {currentWorkspace?.id === organization.id && (
                                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                    <hr className="border-gray-200 dark:border-zinc-800" />

                    <div onClick={handleCreateWorkspace} className="p-2 cursor-pointer rounded-lg group hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition" >
                        <p className="flex items-center text-xs gap-2 my-1 w-full text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 font-medium">
                            <Plus className="w-4 h-4" /> Create Workspace
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkspaceDropdown;
