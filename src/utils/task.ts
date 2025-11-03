import { TaskType } from "@/enums/appEnum";
import { AttendanceType, ReturnData, TaskInfo } from "@/types/store";
import { ElMessage } from "element-plus";
import { ApiStatus } from "./http/status";
import { taskData } from "./data";
import { TaskRequest } from "@/api/taskApi";
import EmojiText from "./emojo";
import { useUserStore } from "@/store/modules/user";
import { AttendanceEnum, getAttendanceEnum } from "@/enums/classEnum";
import { socket } from "./socket";

const userInfo = computed(() => useUserStore().getUserInfo)

export const lookuser = ref(userInfo.value.id);
export const rangeDay = ref<[Date, Date]>([new Date(), new Date()])

export const getTaskType = (type: TaskType): ReturnData => {
  switch (Number(type)) {
    case TaskType.WORK:
      return {
        text: '作业',
        type: 'primary',
        color: '#409EFF'
      }
    case TaskType.NOTICE:
      return {
        text: '通知',
        type: 'danger',
        color: '#F56C6C'
      }
    case TaskType.ARRIVE:
      return {
        text: '考勤',
        type: 'warning',
        color: '#E6A23C'
      }
    default:
      return {
        text: '未知',
        type: 'info',
        color: '#909399'
      }
  }
}

export const getTaskEndDay = (item: TaskInfo) => {
  const day = Math.floor((Number(item.end) - Date.now()) / (86400000))
  const hour = Math.floor(((Number(item.end) - Date.now()) % (86400000)) / (3600000))
  const minute = Math.floor(((Number(item.end) - Date.now()) % (3600000)) / (60000))
  if (day < 0) return '已截止'
  else {
    if (day === 0) {
      if (hour === 0)
        return `剩 ${minute} 分`
      else return `剩 ${hour} 时`
    } else return `剩 ${day} 天`
  }
}

export const getTaskEnd = (item: TaskInfo): ReturnData => {
  const remainingTime = Number(item.end) - Date.now()
  if (remainingTime > 0) {
    if (remainingTime < (3 * 24 * 60 * 60 * 1000))
      return {
        text: "即将截止",
        type: "danger",
        color: '#F56C6C'
      }

    return {
      text: "进行中",
      type: "success",
      color: '#67C23A'
    }
  } else return {
    text: "已截止",
    type: "info",
    color: '#909399'
  }
}

export const updateTaskList = async (taskInfo: TaskInfo, change: {
  true: string[],
  check: AttendanceType[]
}) => {

  const u_list = change.true
  const list = {
    true: u_list,
    check: change.check,
    all: taskInfo.list.all,
    false: taskInfo.list.all.filter(item => !u_list.includes(item))
  }
  const res = await TaskRequest.updateList({
    taskid: taskInfo.id,
    list: JSON.stringify(list)
  })
  if (res.err === ApiStatus.success) {
    if (taskInfo.type != TaskType.NOTICE)
      ElMessage.success(`修改成功 ${EmojiText[200]}`)
    taskData.value.updateList({ id: taskInfo.id, list })
    socket.emit('task-update-list', { id: taskInfo.id, list, user: userInfo.value.id })
  } else ElMessage.error(res.result)
}

export const fileDownload = async (files: string) => {
  // const res = await TaskRequest.download(files.filename, files.originalname)
  // if (res.data.err === ApiStatus.success) {
  //   const a = document.createElement("a");
  //   a.href = (res.config.url as string) + '&down=true';
  //   a.click();
  // }
  // else ElMessage.error(res.data.result);
}

// 获取摘要
export const getSummary = (taskInfo: TaskInfo, maxlength: number = 200) => {
  return taskInfo.content?.replace(/<[^>]+>/g, '').substring(0, maxlength)
}

export const getStatisticsSimulateCount = computed(() => (key?: AttendanceEnum) => {
  return key ?
    computed(() => taskData.value.all()).value
      .filter(item =>
        item.type == TaskType.ARRIVE &&
        Number(item.start) >= rangeDay.value[0].getTime() &&
        Number(item.start) <= rangeDay.value[1].getTime() &&
        item.list.check.some(check => (check.id === lookuser.value && check.state === key))
      ) :
    computed(() => taskData.value.all()).value
      .filter(item =>
        item.type == TaskType.ARRIVE &&
        Number(item.start) >= rangeDay.value[0].getTime() &&
        Number(item.start) <= rangeDay.value[1].getTime() &&
        item.list.check.some(check => check.id === lookuser.value)
      )
});

export const isSimulateState = (taskItem: TaskInfo, look?: boolean) => {
  const userid = look ? lookuser.value : userInfo.value.id;
  const data = {
    name: getAttendanceEnum(taskItem.list.check.filter(item => item.id === userid)[0].state).name,
    value: taskItem.list.check.filter(item => item.id === userid)[0].state
  }
  return data;
}