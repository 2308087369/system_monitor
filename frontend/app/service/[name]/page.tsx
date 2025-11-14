'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient, type ServiceInfo } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceStatusBadge } from '@/components/service-status-badge';
import { ArrowLeft, Play, Square, RotateCw, RefreshCw, Terminal } from 'lucide-react';

export default function ServiceDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const serviceName = decodeURIComponent(params.name as string);

  const [service, setService] = useState<ServiceInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadServiceDetails();
      loadLogs();
    }
  }, [user, serviceName]);

  const loadServiceDetails = async () => {
    try {
      setError('');
      setIsLoading(true);
      const data = await apiClient.getServiceStatus(serviceName);
      setService(data);
    } catch (err) {
      setError('Failed to load service details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const data = await apiClient.getServiceLogs(serviceName, 100);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleControl = async (action: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setIsControlling(true);
      const result = await apiClient.controlService(serviceName, action);
      if (result.success) {
        setSuccessMessage(`Successfully ${action}ed service`);
        setTimeout(() => {
          loadServiceDetails();
          loadLogs();
        }, 1000);
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} service`);
    } finally {
      setIsControlling(false);
    }
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-neutral-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">{service.name}</h1>
              <p className="text-sm text-neutral-600">{service.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Status Card */}
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg">Service Status</CardTitle>
              <CardDescription>Current state and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Status</p>
                <ServiceStatusBadge status={service.status} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Active State</p>
                  <p className="text-base font-semibold text-neutral-900 mt-1">{service.active}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Enabled</p>
                  <p className="text-base font-semibold text-neutral-900 mt-1">{service.enabled}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Loaded</p>
                <p className="text-base font-semibold text-neutral-900 mt-1">{service.loaded ? 'Yes' : 'No'}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  loadServiceDetails();
                  loadLogs();
                }}
                className="w-full border-neutral-300 hover:bg-neutral-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>

          {/* Control Card */}
          {user.role === 'admin' && (
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-lg">Service Control</CardTitle>
                <CardDescription>Manage service lifecycle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleControl('start')}
                  disabled={isControlling}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Service
                </Button>
                <Button
                  onClick={() => handleControl('stop')}
                  disabled={isControlling}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Service
                </Button>
                <Button
                  onClick={() => handleControl('restart')}
                  disabled={isControlling}
                  variant="outline"
                  className="w-full border-neutral-300 hover:bg-neutral-100"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Restart Service
                </Button>
                <div className="pt-3 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-3">Advanced Options</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleControl('enable')}
                      disabled={isControlling}
                      variant="outline"
                      size="sm"
                      className="border-neutral-300 hover:bg-neutral-100 text-xs"
                    >
                      Enable
                    </Button>
                    <Button
                      onClick={() => handleControl('disable')}
                      disabled={isControlling}
                      variant="outline"
                      size="sm"
                      className="border-neutral-300 hover:bg-neutral-100 text-xs"
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Logs Card */}
        <Card className="mt-6 border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Service Logs</CardTitle>
                <CardDescription>Recent journal entries (last 100 lines)</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={isLoadingLogs}
                className="border-neutral-300 hover:bg-neutral-100"
              >
                <Terminal className="w-4 h-4 mr-2" />
                Refresh Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-900 rounded-lg p-4 font-mono text-xs text-neutral-100 overflow-x-auto max-h-96 overflow-y-auto">
              {isLoadingLogs ? (
                <div className="text-neutral-400">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-neutral-400">No logs available</div>
              ) : (
                <pre className="whitespace-pre-wrap break-words">{logs.join('\n')}</pre>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
