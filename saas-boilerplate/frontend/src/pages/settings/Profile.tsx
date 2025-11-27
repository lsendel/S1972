import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileSettings() {
    const { user } = useAuth();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            full_name: user?.full_name,
            email: user?.email,
        }
    });

    const onSubmit = (data: any) => {
        console.log("Updating profile", data);
        // Implement update mutation
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                    Update your personal information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input {...register("full_name")} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input {...register("email")} disabled />
                        <p className="text-[0.8rem] text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    <Button type="submit">Save changes</Button>
                </form>
            </CardContent>
        </Card>
    );
}
