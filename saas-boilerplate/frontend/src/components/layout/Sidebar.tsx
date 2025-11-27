import React, { Fragment } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { HomeIcon, Cog6ToothIcon, UsersIcon, CreditCardIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { useOrganizations } from '@/hooks/useOrganization';

const navigation = [
    { name: 'Dashboard', href: '', icon: HomeIcon },
    { name: 'Team', href: '/settings/team', icon: UsersIcon },
    { name: 'Billing', href: '/settings/billing', icon: CreditCardIcon },
];

const settingsNavigation = [
    { name: 'Profile', href: '/settings/profile', icon: UserCircleIcon },
    { name: 'Security', href: '/settings/security', icon: ShieldCheckIcon },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

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
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                    <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                        alt="Your Company"
                    />
                </div>

                {/* Organization Switcher */}
                {orgSlug && (
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex w-full items-center gap-x-3 rounded-md bg-gray-50 px-3 py-2 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-100">
                            <span className="flex-1 truncate text-left">
                                {currentOrg?.name || orgSlug}
                            </span>
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
                            <Menu.Items className="absolute left-0 right-0 z-10 mt-2 origin-top rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                {organizations?.map((org) => (
                                    <Menu.Item key={org.id}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => handleOrgSwitch(org.slug)}
                                                className={classNames(
                                                    active ? 'bg-gray-50' : '',
                                                    'flex w-full items-center justify-between px-3 py-2 text-sm leading-6 text-gray-900'
                                                )}
                                            >
                                                <span className="truncate">{org.name}</span>
                                                {org.slug === orgSlug && (
                                                    <CheckIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
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
                                    const isActive = location.pathname === fullHref;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                to={fullHref}
                                                className={classNames(
                                                    isActive
                                                        ? 'bg-gray-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <item.icon
                                                    className={classNames(
                                                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                        'h-6 w-6 shrink-0'
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
                            <div className="text-xs font-semibold leading-6 text-gray-400 px-2 mb-2">Settings</div>
                            <ul role="list" className="-mx-2 space-y-1">
                                {settingsNavigation.map((item) => {
                                    const fullHref = `/app/${orgSlug}${item.href}`;
                                    const isActive = location.pathname === fullHref;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                to={fullHref}
                                                className={classNames(
                                                    isActive
                                                        ? 'bg-gray-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <item.icon
                                                    className={classNames(
                                                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                        'h-6 w-6 shrink-0'
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
