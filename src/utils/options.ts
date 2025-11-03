import { FileState, TaskType } from "@/enums/appEnum"

export const sexOptions = [
  { value: 1, label: '男' },
  { value: 0, label: '女' }
]

export const fileStateOptions = [
  { value: FileState.SUCCESS, label: '正常' },
  { value: FileState.WAITING, label: '审核中' },
  { value: FileState.ABNORMAL, label: '异常' },
  { value: FileState.DELETE, label: '已删除' },
]

export const TaskOptions = [
  { value: TaskType.ARRIVE, label: '考勤', color: '#faad14' },
  { value: TaskType.WORK, label: '作业', color: '#1485ff' },
  { value: TaskType.NOTICE, label: '通知', color: '#ff4d4f' },
]