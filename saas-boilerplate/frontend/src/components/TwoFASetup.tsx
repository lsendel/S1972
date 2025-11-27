import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

export default function TwoFASetup() {
    const { user, checkAuth } = useAuthStore();
    const [step, setStep] = useState<'initial' | 'setup' | 'enabled'>('initial');
    const [setupData, setSetupData] = useState<{ device_id: number; qr_code: string; config_url: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<{ token: string }>();

    React.useEffect(() => {
        if (user?.totp_enabled) {
            setStep('enabled');
        } else {
            setStep('initial');
        }
    }, [user?.totp_enabled]);

    const startSetup = async () => {
        try {
            setError(null);
            const data = await authApi.setup2FA();
            setSetupData(data);
            setStep('setup');
        } catch (err) {
            console.error(err);
            setError("Failed to start 2FA setup");
        }
    };

    const onVerify = async (data: { token: string }) => {
        if (!setupData) return;
        try {
            setError(null);
            await authApi.verify2FA({
                device_id: setupData.device_id,
                token: data.token
            });
            await checkAuth(); // Refresh user to update totp_enabled status
            setStep('enabled');
        } catch (err: any) {
            console.error(err);
            setError(err.detail || "Invalid code. Please try again.");
        }
    };

    if (step === 'enabled') {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span className="font-medium">Two-factor authentication is enabled.</span>
                </div>
                <p className="text-sm text-gray-500">
                    Your account is secured with 2FA. You will be asked for a code when you log in.
                </p>
                 {/* Future: Add disable button */}
            </div>
        );
    }

    if (step === 'setup' && setupData) {
        return (
            <div className="space-y-6">
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium">Scan QR Code</h3>
                    <p className="text-sm text-gray-500">
                        Use your authenticator app (like Google Authenticator or Authy) to scan this QR code.
                    </p>
                </div>

                <div className="flex justify-center rounded-lg border bg-white p-4">
                    <img src={`data:image/png;base64,${setupData.qr_code}`} alt="2FA QR Code" className="h-48 w-48" />
                </div>

                <form onSubmit={handleSubmit(onVerify)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">Verification Code</Label>
                        <Input
                            id="token"
                            placeholder="123456"
                            {...register("token", { required: true, minLength: 6, maxLength: 6 })}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex gap-2">
                         <Button type="button" variant="outline" onClick={() => setStep('initial')}>Cancel</Button>
                         <Button type="submit" disabled={isSubmitting}>Verify & Enable</Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                Two-factor authentication adds an extra layer of security to your account.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={startSetup}>Enable 2FA</Button>
        </div>
    );
}
