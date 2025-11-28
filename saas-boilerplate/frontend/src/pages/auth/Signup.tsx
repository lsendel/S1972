import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { MetaTags } from '../../components/SEO/MetaTags';
import { AnalyticsAuth } from '../../lib/analytics/events';
import { getFirstTouchUTM, getLastTouchUTM } from '../../lib/analytics/utm';
import { trackEvent } from '../../lib/analytics';
import type { ApiError } from '../../api/generated';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signup, isSigningUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Get UTM attribution data
      const firstTouch = getFirstTouchUTM();
      const lastTouch = getLastTouchUTM();

      await signup({
        email,
        password,
        full_name: fullName,
        // Include UTM data for backend attribution
        ...firstTouch
      });

      // Track successful signup with analytics
      AnalyticsAuth.signup('email');

      // Track with attribution data
      trackEvent('signup_with_attribution', {
        first_touch_source: firstTouch?.utm_source,
        first_touch_medium: firstTouch?.utm_medium,
        first_touch_campaign: firstTouch?.utm_campaign,
        last_touch_source: lastTouch?.utm_source,
        last_touch_medium: lastTouch?.utm_medium,
        last_touch_campaign: lastTouch?.utm_campaign,
      });

      // Redirect to login
      navigate('/login');
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { error?: string, detail?: string };
      setError(body?.error ?? body?.detail ?? 'Failed to sign up');
    }
  };

  return (
    <>
      <MetaTags
        title="Sign Up"
        description="Create your free account and start your 14-day trial. No credit card required."
        keywords={['signup', 'register', 'free trial', 'saas', 'create account']}
      />
      <AuthLayout
        title="Create an account"
        subtitle="Enter your email below to create your account"
        footerText="Already have an account?"
        footerLinkText="Sign in"
        footerLink="/login"
      >
      <div className="grid gap-6">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                disabled={isSigningUp}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isSigningUp}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                disabled={isSigningUp}
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center" data-testid="error-message" role="alert">
                {error}
              </div>
            )}
            <Button disabled={isSigningUp}>
              {isSigningUp && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign Up with Email
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
        <Button variant="outline" type="button" disabled={isSigningUp}>
          GitHub
        </Button>
      </div>
    </AuthLayout>
    </>
  );
}
