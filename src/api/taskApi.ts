import request from '@/utils/http'
import { computed } from "vue"
import { BaseResult } from '@/types/axios'
import { useUserStore } from '@/store/modules/user'
import { TaskDefualt, TaskUpdate, TaskUpdateList } from './model/taskParams'

const getUserData = computed(() => {
  const userStore = useUserStore().getUserInfo
  return {
    id: userStore.id,
    token: userStore.token
  }
})

class TaskService {
  static request(url: string, params?: any) {
    return request.post<BaseResult>({
      url: `/task-${url}`, params
    })
  }
}

export const TaskRequest = {
  add(params: TaskDefualt) {
    return TaskService.request('add', { ...params });
  },
  get(taskid: string, classid: string) {
    return TaskService.request('get', { ...getUserData.value, taskid, classid });
  },
  length() {
    return TaskService.request('lenght', { ...getUserData.value, classid: useUserStore().info.class });
  },
  getAll(page?: number, size?: number) {
    return TaskService.request('all', { ...getUserData.value, classid: useUserStore().info.class, page, size });
  },
  updateList(params: TaskUpdateList) {
    return TaskService.request('update-list', { ...getUserData.value, ...params });
  },
  update(params: TaskUpdate) {
    return TaskService.request('update', { ...getUserData.value, ...params });
  },
  delete(taskid: string) {
    return TaskService.request('delete', { ...getUserData.value, taskid });
  },
}