import request from '@/utils/http'
import { BaseResult } from '@/types/axios'
import { UserDefualt } from './model/userParams'
import { useUserStore } from '@/store/modules/user'
import { UserInfo } from '@/types/store'
import { PowerType } from '@/enums/appEnum'
import axios from 'axios'

const getUserData = computed(() => {
  const userStore = useUserStore().getUserInfo;
  return {
    id: userStore.id,
    token: userStore.token
  }
})

class UserService {
  static request(url: string, params: any) {
    return request.post<BaseResult>({
      url: `/user-${url}`, params
    })
  }
}

const setFormData = (params: File) => {
  const formData = new FormData();
  formData.append('id', getUserData.value.id as string);
  formData.append('token', getUserData.value.token as string);
  formData.append('file', params);
  formData.append('source', import.meta.env.VITE_API_URL);
  formData.append('time', new Date().getTime().toString());
  return formData;
}

export const UserRequest = {
  add(params: Partial<UserDefualt>) {
    return UserService.request('add', { ...params, ...getUserData.value });
  },
  login(params: Partial<UserDefualt>) {
    return UserService.request('login', params);
  },
  get(params: Partial<UserDefualt>, login: boolean = false) {
    if (login) return UserService.request('get', { ...params });
    return UserService.request('get', { ...params, ...getUserData.value });
  },
  getAll(classid: string) {
    return UserService.request('getall', { classid, ...getUserData.value });
  },
  verify() {
    return UserService.request('verify', { ...getUserData.value });
  },
  password(params: { oldpaw: string, newpaw: string }) {
    return UserService.request('pswd', { ...getUserData.value, ...params });
  },
  update(params: Partial<UserInfo>, source: PowerType) {
    return UserService.request('update', { ...params, userid: params.id, ...getUserData.value, source });
  },
  avatar(params: File) {
    return axios.post(`${import.meta.env.VITE_API_URL}/user-avatar`, setFormData(params))
  },
  delete(userid: string) {
    return UserService.request('delete', { ...getUserData.value, userid });
  },
}
