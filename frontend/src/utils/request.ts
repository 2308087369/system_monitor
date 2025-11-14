import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: (typeof window !== 'undefined' && (window as any).VITE_API_DEV_BASE_URL) || (import.meta as any).env?.VITE_API_DEV_BASE_URL || 'http://127.0.0.1:8000',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 添加认证token (在Node.js环境中跳过localStorage)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }

      // 添加请求时间戳
      if (config.headers) {
        config.headers['X-Request-Time'] = new Date().toISOString()
      }

      // 添加请求时间戳到参数
      if (config.params) {
        config.params._t = Date.now()
      } else {
        config.params = { _t: Date.now() }
      }

      console.log('Request:', config)
      return config
    },
    error => {
      console.error('Request Error:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('Response:', response)

      const { data } = response
      if (data && typeof data === 'object' && ('code' in data || 'success' in data)) {
        if (data.code === 200 || data.success) {
          return data.data || data
        }
        const errorMessage = data.message || '请求失败'
        console.error('Business Error:', errorMessage)
        return Promise.reject(new Error(errorMessage))
      }
      return data
    },
    error => {
      console.error('Response Error:', error)

      // 处理HTTP错误
      if (error.response) {
        const { status, data } = error.response
        switch (status) {
          case 401:
            // 未授权，清除token并跳转登录
            localStorage.removeItem('token')
            window.location.href = '/login'
            break
          case 403:
            console.error('权限不足')
            break
          case 404:
            console.error('请求的资源不存在')
            break
          case 500:
            console.error('服务器内部错误')
            break
          default:
            console.error(`请求失败: ${status}`)
        }
        return Promise.reject(
          new Error(data?.message || `HTTP Error: ${status}`)
        )
      } else if (error.request) {
        console.error('网络错误，请检查网络连接')
        return Promise.reject(new Error('网络错误，请检查网络连接'))
      } else {
        console.error('请求配置错误:', error.message)
        return Promise.reject(error)
      }
    }
  )

  return instance
}

// 导出axios实例
export const apiClient = createAxiosInstance()

// 导出请求方法
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config),
  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => apiClient.post(url, data, config),
  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => apiClient.put(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config),
  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => apiClient.patch(url, data, config),
}

export default apiClient
