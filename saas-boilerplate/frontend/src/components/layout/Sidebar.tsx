import { Fragment } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    UserCircle,
    ShieldCheck,
    ChevronsUpDown,
    Check
} from 'lucide-react';
import { useOrganizations, Organization } from '@/hooks/useOrganization';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '', icon: LayoutDashboard },
    { name: 'Team', href: '/settings/team', icon: Users },
    { name: 'Billing', href: '/settings/billing', icon: CreditCard },
];

const settingsNavigation = [
    { name: 'Profile', href: '/settings/profile', icon: UserCircle },
    { name: 'Security', href: '/settings/security', icon: ShieldCheck },
];

export default function Sidebar() {
    const location = useLocation();
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const navigate = useNavigate();
    const { data: organizations } = useOrganizations();

    const currentOrg = organizations?.find(org => org.slug === orgSlug);

    const handleOrgSwitch = (newOrgSlug: string) => {
        navigate(`/app/${newOrgSlug}`);
    };

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            S
                        </div>
                        SaaS Inc
                    </div>
                </div>

                {/* Organization Switcher */}
                {orgSlug && (
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex w-full items-center gap-x-3 rounded-md bg-muted/50 px-3 py-2 text-sm font-semibold leading-6 hover:bg-muted">
                            <span className="flex-1 truncate text-left">
                                {currentOrg?.name || orgSlug}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute left-0 right-0 z-10 mt-2 origin-top rounded-md bg-popover py-2 shadow-lg ring-1 ring-border focus:outline-none">
                                {organizations?.map((org: Organization) => (
                                    <Menu.Item key={org.id}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => handleOrgSwitch(org.slug)}
                                                className={cn(
                                                    active ? 'bg-muted' : '',
                                                    'flex w-full items-center justify-between px-3 py-2 text-sm leading-6'
                                                )}
                                            >
                                                <span className="truncate">{org.name}</span>
                                                {org.slug === orgSlug && (
                                                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                                                )}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </Menu.Items>
                        </Transition>
                    </Menu>
                )}

                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className="-mx-2 space-y-1">
                                {navigation.map((item) => {
                                    const fullHref = `/app/${orgSlug}${item.href}`;
                                    const isActive = location.pathname === fullHref || (item.href === '' && location.pathname === `/app/${orgSlug}`);
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                to={fullHref}
                                                className={cn(
                                                    isActive
                                                        ? 'bg-muted text-primary'
                                                        : 'text-muted-foreground hover:text-primary hover:bg-muted/50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                                                        'h-4 w-4 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                        <li className="mt-auto">
                            <div className="text-xs font-semibold leading-6 text-muted-foreground px-2 mb-2">Settings</div>
                            <ul role="list" className="-mx-2 space-y-1">
                                {settingsNavigation.map((item) => {
                                    const fullHref = `/app/${orgSlug}${item.href}`;
                                    const isActive = location.pathname === fullHref;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                to={fullHref}
                                                className={cn(
                                                    isActive
                                                        ? 'bg-muted text-primary'
                                                        : 'text-muted-foreground hover:text-primary hover:bg-muted/50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                                                        'h-4 w-4 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}
