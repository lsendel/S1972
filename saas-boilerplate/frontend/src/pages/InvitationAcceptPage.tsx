import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { orgsApi } from '@/api/orgs';
import { useAuthStore } from '@/stores/authStore';
import { useForm } from 'react-hook-form';
import { Invitation } from '@/types/orgs';

export default function InvitationAcceptPage() {
    const { token } = useParams<{ token: string }>();
    const { isAuthenticated, user, login, signup } = useAuthStore();
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');

    // Forms for login/signup if needed
    const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { isSubmitting: isSubmittingLogin } } = useForm();
    const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { isSubmitting: isSubmittingSignup } } = useForm();
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');


    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        const fetchInvitation = async () => {
            try {
                const data = await orgsApi.getInvitation(token);
                setInvitation(data);
                setStatus('valid');
            } catch (err: any) {
                console.error(err);
                setError(err.detail || "Invalid or expired invitation.");
                setStatus('invalid');
            }
        };

        fetchInvitation();
    }, [token]);

    const handleAccept = async () => {
        if (!token) return;
        try {
            await orgsApi.acceptInvitation(token, {});
            setStatus('success');
        } catch (err: any) {
             console.error(err);
             setError(err.detail || "Failed to accept invitation.");
        }
    };

    const onLoginSubmit = async (data: any) => {
        try {
             await login(data);
             // After login, we stay on this page to accept
        } catch (err: any) {
             console.error(err);
             // handle login error
        }
    }

    const onSignupSubmit = async (data: any) => {
        try {
            await signup(data);
        } catch (err: any) {
            console.error(err);
            // handle signup error
        }
    }

    if (status === 'loading') {
        return <div className="flex h-screen items-center justify-center">Loading invitation...</div>;
    }

    if (status === 'invalid' || !invitation) {
        return (
            <div className="flex h-screen flex-col items-center justify-center space-y-4 p-4 text-center">
                <h1 className="text-2xl font-bold text-red-600">Invalid Invitation</h1>
                <p className="text-gray-600">{error || "This invitation link is invalid or has expired."}</p>
                <Link to="/">
                    <Button>Go Home</Button>
                </Link>
            </div>
        );
    }

    if (status === 'success') {
         return (
            <div className="flex h-screen flex-col items-center justify-center space-y-4 p-4 text-center">
                <h1 className="text-2xl font-bold text-green-600">Welcome to {invitation.organization_name}!</h1>
                <p className="text-gray-600">You have successfully joined the organization.</p>
                <Link to="/app">
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
        );
    }

    // Authenticated State -> Accept
    if (isAuthenticated && user) {
        if (user.email !== invitation.email) {
             return (
                <div className="flex h-screen flex-col items-center justify-center space-y-4 p-4 text-center">
                    <h1 className="text-2xl font-bold">Wrong Account</h1>
                    <p className="text-gray-600">
                        This invitation is for <strong>{invitation.email}</strong>, but you are logged in as <strong>{user.email}</strong>.
                    </p>
                    <Button variant="outline" onClick={() => useAuthStore.getState().logout()}>Logout</Button>
                </div>
            );
        }

        return (
            <div className="flex h-screen flex-col items-center justify-center space-y-6 p-4">
                 <div className="text-center">
                    <h1 className="text-2xl font-bold">Join {invitation.organization_name}</h1>
                    <p className="text-gray-600">You have been invited to join as a <strong>{invitation.role}</strong>.</p>
                </div>
                <Button onClick={handleAccept} size="lg">Accept Invitation</Button>
            </div>
        );
    }

    // Unauthenticated State -> Login or Signup
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Join {invitation.organization_name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {authMode === 'login' ? "Sign in to accept the invitation" : "Create an account to accept the invitation"}
                    </p>
                </div>

                {authMode === 'login' ? (
                     <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin(onLoginSubmit)}>
                        <div className="space-y-4">
                             <Input {...registerLogin("email", {required: true})} placeholder="Email" defaultValue={invitation.email} readOnly className="bg-gray-100" />
                             <Input {...registerLogin("password", {required: true})} type="password" placeholder="Password" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmittingLogin}>Sign In</Button>
                         <div className="text-center text-sm">
                            <button type="button" onClick={() => setAuthMode('signup')} className="font-medium text-primary hover:text-primary/90">
                                Need an account? Sign up
                            </button>
                        </div>
                     </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmitSignup(onSignupSubmit)}>
                        <div className="space-y-4">
                             <Input {...registerSignup("email", {required: true})} placeholder="Email" defaultValue={invitation.email} readOnly className="bg-gray-100" />
                             <Input {...registerSignup("full_name", {required: true})} placeholder="Full Name" />
                             <Input {...registerSignup("password", {required: true})} type="password" placeholder="Password" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmittingSignup}>Create Account</Button>
                        <div className="text-center text-sm">
                            <button type="button" onClick={() => setAuthMode('login')} className="font-medium text-primary hover:text-primary/90">
                                Already have an account? Sign in
                            </button>
                        </div>
                     </form>
                )}
            </div>
        </div>
    );
}
