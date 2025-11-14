// API client with unified token management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://180.213.184.159:6996';

interface LoginCredentials {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface UserInfo {
  username: string;
  role: 'admin' | 'user';
}

interface ServiceInfo {
  name: string;
  status: string;
  active: string;
  enabled: string;
  description: string;
  loaded: boolean;
}

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Unauthorized');
      }
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getMe(): Promise<UserInfo> {
    return this.request<UserInfo>('/auth/me');
  }

  // Service endpoints
  async getMonitoredServices(): Promise<string[]> {
    return this.request<string[]>('/monitored-services');
  }

  async getMonitoredStatus(): Promise<ServiceInfo[]> {
    return this.request<ServiceInfo[]>('/monitored-status');
  }

  async getAvailableServices(_page?: number, _pageSize?: number): Promise<Array<{ name: string; description: string; enabled: string; loaded: boolean }>> {
    const all = await this.request<Array<{ name: string; description: string; enabled: string; loaded: boolean }>>('/available-services');
    return all;
  }

  async getServiceStatus(serviceName: string): Promise<ServiceInfo> {
    return this.request<ServiceInfo>(`/service-status/${serviceName}`);
  }

  async addMonitoredService(serviceName: string): Promise<{ message: string; services: string[] }> {
    return this.request('/monitored-services', {
      method: 'POST',
      body: JSON.stringify({ service_name: serviceName }),
    });
  }

  async removeMonitoredService(serviceName: string): Promise<{ message: string }> {
    return this.request(`/monitored-services/${serviceName}`, {
      method: 'DELETE',
    });
  }

  async controlService(serviceName: string, action: string): Promise<{ success: boolean; message: string; return_code?: number }> {
    return this.request(`/service-control/${serviceName}/${action}`, {
      method: 'POST',
    });
  }

  async getServiceLogs(serviceName: string, lines: number = 50): Promise<{ logs: string[]; error?: string }> {
    return this.request(`/service-logs/${serviceName}?lines=${lines}`);
  }

  async getHealth(): Promise<{ status: string; timestamp: string; monitored_services_count: number }> {
    return this.request('/health');
  }
}

export const apiClient = new APIClient();
export type { ServiceInfo, UserInfo };
