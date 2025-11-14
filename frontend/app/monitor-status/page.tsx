'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import * as echarts from 'echarts';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCw, Server, Activity } from 'lucide-react';

type ParsedStatus = {
  activeSince?: string;
  activeAgo?: string;
  mainPid?: number;
  mainProc?: string;
  tasks?: number;
  tasksLimit?: number;
  memory?: string;
  cpu?: string;
};

function parseStatus(message: string): ParsedStatus {
  const lines = message.split('\n');
  const status: ParsedStatus = {};
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('Active:')) {
      const m = l.match(/^Active:\s*active\s*\(running\)\s*since\s*(.*?);\s*(.*)$/);
      if (m) {
        status.activeSince = m[1];
        status.activeAgo = m[2];
      }
    } else if (l.startsWith('Main PID:')) {
      const m = l.match(/^Main PID:\s*(\d+)(?:\s*\(([^)]+)\))?/);
      if (m) {
        status.mainPid = parseInt(m[1], 10);
        status.mainProc = m[2];
      }
    } else if (l.startsWith('Tasks:')) {
      const m = l.match(/^Tasks:\s*(\d+)(?:\s*\(limit:\s*(\d+)\))?/);
      if (m) {
        status.tasks = parseInt(m[1], 10);
        if (m[2]) status.tasksLimit = parseInt(m[2], 10);
      }
    } else if (l.startsWith('Memory:')) {
      const m = l.match(/^Memory:\s*(.+)$/);
      if (m) {
        status.memory = m[1];
      }
    } else if (l.startsWith('CPU:')) {
      const m = l.match(/^CPU:\s*(.+)$/);
      if (m) {
        status.cpu = m[1];
      }
    }
  }
  return status;
}

export default function MonitorStatusPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, ParsedStatus>>({});
  const [stats, setStats] = useState<{ active: number; failed: number; inactive: number; unknown: number }>({ active: 0, failed: 0, inactive: 0, unknown: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const loadAll = async () => {
    try {
      setError('');
      setIsLoading(true);
      const monitored = await apiClient.getMonitoredStatus();
      const activeNames = monitored
        .filter(s => (s.active || '').toLowerCase().trim() === 'active')
        .map(s => s.name);
      const failedCount = monitored.filter(s => (s.active || '').toLowerCase().trim() === 'failed').length;
      const inactiveCount = monitored.filter(s => {
        const a = (s.active || '').toLowerCase().trim();
        return a === 'inactive' || a === 'dead';
      }).length;
      const unknownCount = monitored.filter(s => {
        const a = (s.active || '').toLowerCase().trim();
        return a !== 'active' && a !== 'failed' && a !== 'inactive' && a !== 'dead';
      }).length;
      const calls = activeNames.map(async name => {
        try {
          const res = await apiClient.controlService(name, 'status');
          const parsed = parseStatus(res.message || '');
          return { name, parsed };
        } catch {
          return null;
        }
      });
      const results = await Promise.all(calls);
      const map: Record<string, ParsedStatus> = {};
      for (const r of results) {
        if (r && r.name) map[r.name] = r.parsed;
      }
      setServices(activeNames);
      setData(map);
      setStats({ active: activeNames.length, failed: failedCount, inactive: inactiveCount, unknown: unknownCount });
    } catch {
      setError('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAll();
    }
  }, [user]);

  if (authLoading || !user) return null;

  const filtered = services.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    const names = filtered;
    const taskUsed = names.map(n => {
      const s = data[n];
      const v = s?.tasks ?? 0;
      return v === 0 ? 0.0001 : v;
    });
    const taskLimit = names.map(n => {
      const s = data[n];
      const v = s?.tasksLimit ?? 0;
      return v === 0 ? 0.0001 : v;
    });
    const taskPercent = names.map((_, i) => {
      const used = taskUsed[i];
      const limit = taskLimit[i];
      if (!limit) return 0;
      return Math.round((used / limit) * 100);
    });
    const memoryVals = names.map(n => {
      const s = data[n];
      const m = (s?.memory || '').trim();
      const mm = m.match(/([0-9.]+)\s*([GMK])/i);
      if (!mm) return 0.0001;
      const val = parseFloat(mm[1]);
      const unit = mm[2].toUpperCase();
      const mb = unit === 'G' ? val * 1024 : unit === 'M' ? val : unit === 'K' ? val / 1024 : val;
      return mb === 0 ? 0.0001 : mb;
    });
    const cpuHours = names.map(n => {
      const s = data[n];
      const c = (s?.cpu || '').trim();
      let hours = 0;
      const hm = c.match(/([0-9.]+)h/i);
      const mm = c.match(/([0-9.]+)min/i);
      const sm = c.match(/([0-9.]+)s/i);
      if (hm) hours += parseFloat(hm[1]);
      if (mm) hours += parseFloat(mm[1]) / 60;
      if (sm) hours += parseFloat(sm[1]) / 3600;
      return parseFloat(hours.toFixed(2));
    });

    const initChart = (id: string, option: echarts.EChartsOption) => {
      const el = document.getElementById(id);
      if (!el) return;
      const chart = echarts.init(el);
      chart.setOption(option);
      const resize = () => chart.resize();
      window.addEventListener('resize', resize);
    };

    const toolbox = {
      feature: {
        saveAsImage: {},
        dataView: {},
        magicType: { type: ['line', 'bar'] },
        restore: {},
      },
    };

    initChart('chart-tasks', {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const i = params[0]?.dataIndex ?? 0;
          const name = names[i];
          const used = taskUsed[i];
          const limit = taskLimit[i];
          const percent = taskPercent[i];
          return `${name}<br/>Used: ${used} / Limit: ${limit}<br/>Percent: ${percent}%`;
        },
      },
      toolbox,
      legend: { data: ['Used', 'Limit', 'Percent'] },
      xAxis: [{ type: 'category', data: names }],
      yAxis: [
        { type: 'log', name: 'Threads (log)', logBase: 10 },
        { type: 'value', name: '%', max: 100 }
      ],
      series: [
        { name: 'Used', type: 'bar', data: taskUsed, itemStyle: { color: '#16a34a' } },
        { name: 'Limit', type: 'bar', data: taskLimit, itemStyle: { color: '#94a3b8' } },
        { name: 'Percent', type: 'line', yAxisIndex: 1, data: taskPercent, itemStyle: { color: '#ef4444' } },
      ],
    });

    initChart('chart-memory', {
      tooltip: { trigger: 'axis' },
      toolbox,
      xAxis: { type: 'category', data: names },
      yAxis: { type: 'log', name: 'MB (log)', logBase: 10 },
      series: [{ name: 'Memory (MB)', type: 'bar', data: memoryVals, itemStyle: { color: '#2563eb' } }],
    });

    initChart('chart-cpu', {
      tooltip: { trigger: 'axis' },
      toolbox,
      xAxis: { type: 'category', data: names },
      yAxis: { type: 'value', name: 'Hours' },
      series: [{ name: 'CPU Time (h)', type: 'bar', data: cpuHours, itemStyle: { color: '#f59e0b' } }],
    });
  }, [filtered, data]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="hover:bg-neutral-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Active Monitored Services</h1>
                <p className="text-sm text-neutral-600">Runtime, Tasks, Memory and PID overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadAll} className="border-neutral-300">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative flex gap-3 items-center">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Filter services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-neutral-300"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {isLoading ? (
          <Card className="border-neutral-200">
            <CardContent className="py-12 text-center text-neutral-600">Loading statuses...</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-neutral-200">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">Tasks Usage %</h3>
                <div id="chart-tasks" style={{ width: '100%', height: 360 }} />
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">Memory (MB)</h3>
                <div id="chart-memory" style={{ width: '100%', height: 360 }} />
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">CPU Time (Hours)</h3>
                <div id="chart-cpu" style={{ width: '100%', height: 360 }} />
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((name) => {
                const s = data[name] || {};
                return (
                  <Card key={name} className="border-neutral-200">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-neutral-900">{name}</h3>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">Active</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="text-xs text-neutral-600">
                              <div className="text-neutral-500">Main PID</div>
                              <div className="text-neutral-900 font-semibold">{s.mainPid ?? '-'}</div>
                              <div className="text-neutral-500">{s.mainProc ?? ''}</div>
                            </div>
                            <div className="text-xs text-neutral-600">
                              <div className="text-neutral-500">Tasks</div>
                              <div className="text-neutral-900 font-semibold">{s.tasks ?? '-'}</div>
                              {s.tasksLimit ? <div className="text-neutral-500">Limit {s.tasksLimit}</div> : null}
                            </div>
                            <div className="text-xs text-neutral-600">
                              <div className="text-neutral-500">Memory</div>
                              <div className="text-neutral-900 font-semibold">{s.memory ?? '-'}</div>
                            </div>
                            <div className="text-xs text-neutral-600">
                              <div className="text-neutral-500">CPU</div>
                              <div className="text-neutral-900 font-semibold">{s.cpu ?? '-'}</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-neutral-600">
                            <div>Since: <span className="text-neutral-900 font-semibold">{s.activeSince ?? '-'}</span></div>
                            {s.activeAgo ? <div>Uptime: <span className="text-neutral-900 font-semibold">{s.activeAgo}</span></div> : null}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <Card className="border-neutral-200">
                <CardContent className="py-6 text-sm text-neutral-600">No active monitored services matched</CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
