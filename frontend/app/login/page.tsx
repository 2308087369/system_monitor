'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md border-neutral-200">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-neutral-900">Service Monitor</CardTitle>
            <CardDescription className="text-neutral-600">
              Sign in to monitor your Linux services
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-neutral-700">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-neutral-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-neutral-300"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-xs text-neutral-500 text-center pt-2">
              Test account: admin / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
