import { UserRequest } from "@/api/usersApi";
import { TaskInfo, UserInfo } from "@/types/store";
import { ApiStatus } from "./http/status";
import { useUserStore } from "@/store/modules/user";
import { TaskRequest } from "@/api/taskApi";

const userInfoList = ref<UserInfo[]>([]);
const taskInfoList = ref<TaskInfo[]>([]);

export const userData = computed(() => {
  const get = async (userid: string) => {
    if (userInfoList.value.filter((item: UserInfo) => item.id == userid).length === 0) {
      const userData = await UserRequest.get({ userid, classid: useUserStore().info.class });
      if (userData.err === ApiStatus.success)
        userInfoList.value.push(userData.result);
    }
  }
  const use = (userid: string): UserInfo => {
    const getList = userInfoList.value.filter((item: UserInfo) => item.id == userid)
    if (getList.length > 0) {
      if (getList.length > 1) userInfoList.value = [...new Set(userInfoList.value)];
      return userInfoList.value.filter((item: UserInfo) => item.id == userid)[0];
    } else return {} as UserInfo;
  }
  const add = (userinfo: UserInfo | UserInfo[]) => {
    if ((userinfo as UserInfo).id)
      userinfo = [userinfo] as UserInfo[];

    if ((userinfo as UserInfo[]).length > 0)
      (userinfo as UserInfo[]).forEach(item => {
        userInfoList.value.push(item)
      });
  }
  const all = (): UserInfo[] => {
    return computed(() => userInfoList.value).value
  }
  return {
    add,
    get,
    use,
    all
  }
})

export const taskData = computed(() => {
  const get = async (taskid: string, classid: string): Promise<Boolean> => {
    if (taskInfoList.value.filter((item: TaskInfo) => item.id == taskid).length === 0) {
      const taskData = await TaskRequest.get(taskid, classid);
      if (taskData.err === ApiStatus.success) {
        taskInfoList.value.push(taskData.result);
        return true
      } else return false
    } else return true
  }
  const use = (taskid: string): TaskInfo => {
    if (taskInfoList.value.filter((item: TaskInfo) => item.id == taskid).length > 0)
      return taskInfoList.value.filter((item: TaskInfo) => item.id == taskid)[0];
    else return {} as TaskInfo;
  }
  const add = (taskinfo: TaskInfo | TaskInfo[]) => {
    if ((taskinfo as TaskInfo).id)
      taskinfo = [taskinfo] as TaskInfo[];

    if ((taskinfo as TaskInfo[]).length > 0)
      (taskinfo as TaskInfo[]).forEach(item => {
        taskInfoList.value.push(item)
      });

    taskInfoList.value.sort((a, b) => {
      return Number(b.start) - Number(a.start);
    })
  }
  const dele = (taskid: string) => {
    if (!taskid) return false;
    const index = taskInfoList.value.findIndex(item => item.id === taskid);
    if (index === -1) return false;
    taskInfoList.value.splice(index, 1);
    return true;
  }
  const updateList = (taskinfo: Partial<TaskInfo>) => {
    const index = taskInfoList.value.findIndex((item: TaskInfo) => item.id == taskinfo.id)
    if (index !== -1)
      taskInfoList.value[index].list = taskinfo.list || taskInfoList.value[index].list
  }
  const update = (taskinfo: TaskInfo) => {
    if (!taskinfo.id) return false;
    const index = taskInfoList.value.findIndex((item: TaskInfo) => item.id == taskinfo.id)
    if (index === -1) return false;
    taskInfoList.value[index] = taskinfo;
    return true;
  }
  const all = (): TaskInfo[] => {
    return computed(() => taskInfoList.value).value
  }
  return {
    add,
    get,
    use,
    all,
    dele,
    update,
    updateList
  }
})