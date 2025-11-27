import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TwoFASetup from '@/components/TwoFASetup';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data: any) => {
    // Implement update profile logic here
    console.log('Update profile', data);
    // await updateProfile(data);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-gray-500">Manage your personal account information.</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register("email")}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register("full_name", { required: true })}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Security</h2>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
             <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
             <TwoFASetup />
        </div>
      </div>
    </div>
  );
}
