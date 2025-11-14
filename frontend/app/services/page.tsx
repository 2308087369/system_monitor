'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Search, Server } from 'lucide-react';

interface AvailableService {
  name: string;
  description: string;
  enabled: string;
  loaded: boolean;
}

export default function ServicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [allAvailableServices, setAllAvailableServices] = useState<AvailableService[]>([]);
  const [monitoredServices, setMonitoredServices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      setError('');
      setIsLoading(true);
      const [allAvailable, monitored] = await Promise.all([
        apiClient.getAvailableServices(),
        apiClient.getMonitoredServices(),
      ]);
      setAllAvailableServices(allAvailable);
      setMonitoredServices(monitored);
    } catch (err) {
      setError('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = allAvailableServices.filter(service =>
      service.name.toLowerCase().includes(q) ||
      service.description.toLowerCase().includes(q)
    );
    setTotal(filtered.length);
    const start = (page - 1) * pageSize;
    setAvailableServices(filtered.slice(start, start + pageSize));
  }, [searchQuery, page, pageSize, allAvailableServices]);

  const handleAddService = async (serviceName: string) => {
    try {
      setError('');
      const res = await apiClient.addMonitoredService(serviceName);
      setMonitoredServices(res.services);
    } catch (err) {
      setError(`Failed to add service: ${serviceName}`);
    }
  };

  const handleRemoveService = async (serviceName: string) => {
    try {
      setError('');
      await apiClient.removeMonitoredService(serviceName);
      setMonitoredServices(prev => prev.filter(name => name !== serviceName));
    } catch (err) {
      setError(`Failed to remove service: ${serviceName}`);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  const filteredServices = availableServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSearch = async () => {
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
              <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Manage Services</h1>
                <p className="text-sm text-neutral-600">Add or remove services from monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
            <div className="relative flex gap-3 items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
                className="pl-10 border-neutral-300"
              />
              <select
                value={pageSize}
                onChange={e => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
                className="border border-neutral-300 rounded-md text-sm px-2 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page<=1}
                  onClick={() => { setPage(p => Math.max(1, p-1)); }}
                  className="border-neutral-300"
                >
                  上一页
                </Button>
                <span className="text-sm text-neutral-600">第 {page} / 共 {totalPages} 页</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page>=totalPages}
                  onClick={() => { setPage(p => Math.min(totalPages, p+1)); }}
                  className="border-neutral-300"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-neutral-200">
            <CardContent className="pt-6">
              <p className="text-sm text-neutral-600">Available Services</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{availableServices.length}</p>
            </CardContent>
          </Card>
          <Card className="border-neutral-200">
            <CardContent className="pt-6">
              <p className="text-sm text-neutral-600">Monitored Services</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{monitoredServices.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        {isLoading ? (
          <Card className="border-neutral-200">
            <CardContent className="py-12 text-center text-neutral-600">
              Loading services...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => {
              const isMonitored = monitoredServices.includes(service.name);
              return (
                <Card key={service.name} className="border-neutral-200">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-neutral-900">{service.name}</h3>
                          {isMonitored && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                              Monitored
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 mb-1">{service.description}</p>
                        <div className="flex gap-3 text-xs text-neutral-500">
                          <span>Enabled: <span className="font-medium text-neutral-700">{service.enabled}</span></span>
                          <span>Loaded: <span className="font-medium text-neutral-700">{service.loaded ? 'Yes' : 'No'}</span></span>
                        </div>
                      </div>
                      {isMonitored ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveService(service.name)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddService(service.name)}
                          className="border-neutral-300 hover:bg-neutral-100"
                        >
                          <Plus className="w-3 h-3 mr-1.5" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredServices.length === 0 && searchQuery.trim().length > 0 && (
              <Card className="border-neutral-200">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-600">未在可用列表中找到</div>
                      <div className="text-sm text-neutral-900 font-semibold mt-1">{searchQuery}</div>
                      <div className="text-xs text-neutral-500 mt-1">您仍可尝试直接添加至监控，后端会校验服务是否存在</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddService(searchQuery)}
                      className="border-neutral-300 hover:bg-neutral-100"
                    >
                      <Plus className="w-3 h-3 mr-1.5" />
                      直接添加
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
