'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient, type ServiceInfo } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBadge } from '@/components/service-status-badge';
import { Server, LogOut, Plus, RefreshCw, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      setError('');
      setIsLoading(true);
      const data = await apiClient.getMonitoredStatus();
      setServices(data);
    } catch (err) {
      setError('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeCount = services.filter(s => s.active === 'active').length;
  const failedCount = services.filter(s => s.active === 'failed').length;
  const inactiveCount = services.filter(s => s.active === 'inactive' || s.active === 'dead').length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Service Monitor</h1>
                <p className="text-sm text-neutral-600">
                  Logged in as <span className="font-medium">{user.username}</span>
                  {user.role === 'admin' && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200">
                      Admin
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-neutral-300 hover:bg-neutral-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-neutral-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Services</p>
                  <p className="text-3xl font-semibold text-neutral-900 mt-1">{services.length}</p>
                </div>
                <Activity className="w-8 h-8 text-neutral-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Active</p>
                  <p className="text-3xl font-semibold text-green-800 mt-1">{activeCount}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Failed</p>
                  <p className="text-3xl font-semibold text-red-800 mt-1">{failedCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Inactive</p>
                  <p className="text-3xl font-semibold text-neutral-700 mt-1">{inactiveCount}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">—</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Monitored Services</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadServices}
              disabled={isLoading}
              className="border-neutral-300 hover:bg-neutral-100"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => router.push('/monitor-status')}
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Status Overview
            </Button>
            {user.role === 'admin' && (
              <Button
                onClick={() => router.push('/services')}
                className="bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Services
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Services List */}
        {isLoading ? (
          <Card className="border-neutral-200">
            <CardContent className="py-12 text-center text-neutral-600">
              Loading services...
            </CardContent>
          </Card>
        ) : services.length === 0 ? (
          <Card className="border-neutral-200">
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No services are being monitored yet</p>
              {user.role === 'admin' && (
                <Button
                  onClick={() => router.push('/services')}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Services
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.name} className="border-neutral-200 hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-neutral-900">{service.name}</h3>
                        <ServiceStatusBadge status={service.status} />
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">{service.description}</p>
                      <div className="flex gap-4 text-xs text-neutral-500">
                        <span>Enabled: <span className="font-medium text-neutral-700">{service.enabled}</span></span>
                        <span>Loaded: <span className="font-medium text-neutral-700">{service.loaded ? 'Yes' : 'No'}</span></span>
                      </div>
                    </div>
                    <Link href={`/service/${encodeURIComponent(service.name)}`}>
                      <Button variant="outline" size="sm" className="border-neutral-300 hover:bg-neutral-100">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
