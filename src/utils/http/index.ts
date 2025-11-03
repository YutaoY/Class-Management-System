import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import EmojiText from '../emojo'
import { useUserStore } from '@/store/modules/user'
import { useClassStore } from '@/store/modules/class'
import { ApiStatus } from './status'

const axiosInstance = axios.create({
  timeout: 15000, // 请求超时时间(毫秒)
  baseURL: import.meta.env.VITE_API_URL, // API地址
  withCredentials: true, // 异步请求携带cookie
  transformRequest: [(data) => JSON.stringify(data)], // 请求数据转换为 JSON 字符串
  validateStatus: (status) => status >= 200 && status < 300, // 只接受 2xx 的状态码
  headers: {
    post: { 'Content-Type': 'application/json;charset=utf-8' },
    get: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
  },
  transformResponse: [
    (data) => {
      // 响应数据转换
      try {
        return typeof data === 'string' && data.startsWith('{') ? JSON.parse(data) : data
      } catch {
        return data // 解析失败时返回原数据
      }
    }
  ]
})

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === "production") {
      // 返回状态值为1010：身份无效，重新登陆
      if (response.data.err === ApiStatus.relogin) {
        ElMessage.error('身份无效，请重新登录！')
        useUserStore().logOut();
      }
    }
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log('repeated request: ' + error.message)
    } else {
      const errorMessage = error.response?.data.message
      ElMessage.error(
        errorMessage
          ? `${errorMessage} ${EmojiText[500]}`
          : `请求超时或服务器异常！${EmojiText[500]}`
      )
    }
    return Promise.reject(error)
  }
)

// 请求
async function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  const userStore = useUserStore()
  const classStore = useClassStore()
  const userInfo = computed(() => userStore.getUserInfo)
  const classInfo = computed(() => classStore.getClassInfo)
  const Authorization = {
    ID: userInfo.value.id,
    姓名: userInfo.value.name,
    密钥: userInfo.value.token,
    班级ID: classInfo.value.id,
    班级名称: classInfo.value.name
  }
  config.headers = {
    'Authorization': userStore.isLogin ? encodeURIComponent(JSON.stringify(Authorization)) : ''
  }
  // 将 POST | PUT 请求的参数放入 data 中，并清空 params
  if (config.method === 'POST' || config.method === 'PUT') {
    config.data = config.params
    config.params = {}
  }
  try {
    const res = await axiosInstance.request<T>({ ...config })
    return res.data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      // 可以在这里处理 Axios 错误
    }
    return Promise.reject(e)
  }
}

// API 方法集合
const api = {
  get<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'GET' }) // GET 请求
  },
  post<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'POST' }) // POST 请求
  },
  put<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'PUT' }) // PUT 请求
  },
  del<T>(config: AxiosRequestConfig): Promise<T> {
    return request({ ...config, method: 'DELETE' }) // DELETE 请求
  }
}

export default api
