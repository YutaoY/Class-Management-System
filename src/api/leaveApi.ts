import request from '@/utils/http'
import { BaseResult } from '@/types/axios'
import { useUserStore } from '@/store/modules/user'

const getUserData = computed(() => {
  const userStore = useUserStore().getUserInfo;
  return {
    id: userStore.id,
    name: userStore.name,
    token: userStore.token
  }
})

class LeaveService {
  static request(url: string, params: any) {
    return request.post<BaseResult>({
      url: `/leave-${url}`, params
    })
  }
}

export const LeaveRequest = {
  add(params: { img: string, md5: string, class: string }) {
    return LeaveService.request('add', { ...params, ...getUserData.value });
  },
  get() {
    return LeaveService.request('get', { ...getUserData.value });
  },
  cover(params: { class: string }) {
    return LeaveService.request('cover', { ...params, ...getUserData.value });
  },
  class(params: { class: string }) {
    return LeaveService.request('class', { ...params, ...getUserData.value });
  },
}
