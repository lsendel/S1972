import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { orgsApi } from '@/api/orgs';
import { Organization, Invitation } from '@/types/orgs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function OrganizationSettingsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        loadOrgs();
    }, []);

    useEffect(() => {
        if (currentOrg) {
            loadInvitations(currentOrg.slug);
        }
    }, [currentOrg]);

    const loadOrgs = async () => {
        try {
            const data = await orgsApi.list();
            setOrganizations(data);
            if (data.length > 0) {
                setCurrentOrg(data[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadInvitations = async (slug: string) => {
        try {
            const data = await orgsApi.listInvitations(slug);
            setInvitations(data);
        } catch (err) {
            console.error(err);
        }
    };

    const onCreateOrg = async (data: any) => {
        try {
            const newOrg = await orgsApi.create(data);
            setOrganizations([...organizations, newOrg]);
            setCurrentOrg(newOrg);
            reset();
        } catch (err) {
            console.error(err);
        }
    };

    const onInvite = async (data: any) => {
        if (!currentOrg) return;
        setInviteError(null);
        try {
            const newInvite = await orgsApi.createInvitation(currentOrg.slug, {
                email: data.email,
                role: data.role
            });
            setInvitations([...invitations, newInvite]);
            reset({ email: '', role: 'member' }); // reset form but keep default role
        } catch (err: any) {
            console.error(err);
            setInviteError(err.detail || "Failed to send invitation.");
        }
    };

    const onRevoke = async (invitationId: string) => {
         if (!currentOrg) return;
         try {
             await orgsApi.revokeInvitation(currentOrg.slug, invitationId);
             setInvitations(invitations.filter(i => i.id !== invitationId));
         } catch (err) {
             console.error(err);
         }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
                <p className="text-gray-500">Manage your team and organization details.</p>
            </div>

            {/* Org Selector / Creator */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-semibold">Your Organizations</h2>
                     {/* Allow creating new org */}
                </div>

                {organizations.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="mb-4">You don't have any organizations yet.</p>
                        <form onSubmit={handleSubmit(onCreateOrg)} className="flex gap-2 max-w-md mx-auto">
                            <Input {...register("name", {required: true})} placeholder="Organization Name" />
                            <Button type="submit">Create Organization</Button>
                        </form>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <select
                            className="p-2 border rounded"
                            value={currentOrg?.slug}
                            onChange={(e) => setCurrentOrg(organizations.find(o => o.slug === e.target.value) || null)}
                        >
                            {organizations.map(org => (
                                <option key={org.id} value={org.slug}>{org.name}</option>
                            ))}
                        </select>
                         {/* Optional: Add button to show create org modal/form */}
                    </div>
                )}
            </div>

            {currentOrg && (
                <div className="rounded-lg border bg-white p-6 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Invite Member</h2>
                        <form onSubmit={handleSubmit(onInvite)} className="flex gap-4 items-end">
                             <div className="flex-1 space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" {...register("email", { required: true })} placeholder="colleague@example.com" />
                             </div>
                             <div className="w-32 space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select {...register("role")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                             </div>
                             <Button type="submit">Invite</Button>
                        </form>
                         {inviteError && <p className="text-sm text-red-500 mt-2">{inviteError}</p>}
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
                         {invitations.length === 0 ? (
                            <p className="text-gray-500 text-sm">No pending invitations.</p>
                         ) : (
                            <div className="space-y-2">
                                {invitations.map(invite => (
                                    <div key={invite.id} className="flex items-center justify-between border p-3 rounded-md">
                                        <div>
                                            <p className="font-medium">{invite.email}</p>
                                            <p className="text-xs text-gray-500">Role: {invite.role} • Status: {invite.status}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => onRevoke(invite.id)} className="text-red-600 hover:text-red-700">
                                            Revoke
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
}
