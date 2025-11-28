import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { api } from '../../api/config';
import type { ApiError } from '../../api/generated';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });

      // Check if user has any organizations
      const orgsResponse = await api.organizations.organizationsList({});
      const organizations = orgsResponse.results || [];

      if (organizations.length === 0) {
        // No organizations, redirect to onboarding
        navigate('/onboarding');
      } else {
        // Has organizations, redirect to first one
        navigate(`/app/${organizations[0].slug}`);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { error?: string, detail?: string };
      setError(body?.error ?? body?.detail ?? 'Failed to login');
    }
  };

  return (
    <AuthLayout
      title="Login"
      subtitle="Enter your email below to login to your account"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLink="/signup"
    >
      <div className="grid gap-6">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
                disabled={isLoggingIn}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoCapitalize="none"
                autoComplete="current-password"
                required
                minLength={8}
                disabled={isLoggingIn}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center" data-testid="error-message" role="alert">
                {error}
              </div>
            )}
            <Button disabled={isLoggingIn}>
              {isLoggingIn && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In with Email
            </Button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" type="button" disabled={isLoggingIn}>
          GitHub
        </Button>
      </div>
    </AuthLayout>
  );
}
