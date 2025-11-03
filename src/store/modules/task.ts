import { defineStore } from 'pinia';
import { TaskInfo } from "@/types/store";
import { ApiStatus } from '@/utils/http/status';
import { ElMessage } from 'element-plus';
import { taskData } from '@/utils/data';
import { TaskRequest } from '@/api/taskApi';
import { useUserStore } from './user';
import { useClassStore } from './class';

interface TaskState {
  list: TaskInfo[]
  load: boolean
}

export const useTaskStore = defineStore({
  id: 'taskStore',
  state: (): TaskState => ({
    list: [],
    load: false
  }),
  getters: {
    getTaskList(): TaskInfo[] {
      return this.list
    },
    getTaskLoad(): Boolean {
      return this.load
    },
  },
  actions: {
    async setTaskList() {
      const res = await TaskRequest.length();
      if (res.err === ApiStatus.success) {
        if (res.result === 0) return
        const TASK_COUNT = res.result;
        const THREAD_NUM = navigator.hardwareConcurrency || 4;
        const threadChunkCount = Math.ceil(TASK_COUNT / THREAD_NUM);
        for (let i = 0; i < THREAD_NUM; i++) {
          try {
            const start = i * threadChunkCount;
            if (start > TASK_COUNT) continue;

            const worker = new Worker(new URL('./worker.ts', import.meta.url), {
              type: 'module'
            });

            worker.postMessage({
              id: useUserStore().getUserInfo.id,
              token: useUserStore().getUserInfo.token,
              classid: useClassStore().getClassInfo.id,
              page: start,
              size: threadChunkCount
            });

            worker.onmessage = (e) => {
              worker.terminate();
              if (e.data.type === 'success') {
                if (e.data.data.err === ApiStatus.success) {
                  const list = e.data.data.result;
                  taskData.value.add([...list])
                } else ElMessage.error(e.data.data.result);
              } else {
                console.log(e.data.data);
                ElMessage.error("任务数据接收错误！");
              } 
            };
          } catch (e) {
            console.log(e)
            ElMessage.error("尝试任务请求错误！");
          }
        }
      } else ElMessage.error(res.result)
    }
  }
})