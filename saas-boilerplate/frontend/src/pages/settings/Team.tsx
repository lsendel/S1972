import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOrganization } from '@/hooks/useOrganization';
import { useParams } from 'react-router-dom';

export default function TeamSettings() {
    const { orgSlug } = useParams();
    const { organization } = useOrganization(orgSlug);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            Manage who has access to {organization?.name}.
                        </CardDescription>
                    </div>
                    <Button>Invite Member</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Placeholder for member list */}
                    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 rounded-full bg-gray-200" />
                            <div>
                                <p className="text-sm font-medium leading-none">Admin User</p>
                                <p className="text-sm text-muted-foreground">admin@example.com</p>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">Owner</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
