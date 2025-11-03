import request from '@/utils/http'
import { computed } from "vue";
import { BaseResult } from '@/types/axios'
import { useUserStore } from '@/store/modules/user'
import { ClassInfo } from '@/types/store';
import { ClassDefualt } from './model/classParams';

const getUserData = computed(() => {
  const userStore = useUserStore().getUserInfo;
  return {
    id: userStore.id,
    token: userStore.token
  }
})

class ClassService {
  static request(url: string, params?: Partial<ClassDefualt>) {
    return request.post<BaseResult>({
      url: `/class-${url}`, params
    })
  }
}

export const ClassRequest = {
  add(params: Partial<ClassDefualt>) {
    return ClassService.request('add', { ...params, ...getUserData.value });
  },
  get(params: Partial<ClassDefualt>) {
    return ClassService.request('get', { ...params, ...getUserData.value });
  },
  getAll() {
    return ClassService.request('getall', { ...getUserData.value });
  },
  update(params: Partial<ClassDefualt>, classid: string) {
    return ClassService.request('update', { ...params, classid, ...getUserData.value });
  }
}