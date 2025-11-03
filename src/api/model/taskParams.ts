import { TaskType } from "@/enums/appEnum"

export interface TaskDefualt {
  id?: string
  token?: string
  taskid?: string
  title: string
  content?: string
  files: string
  week: number
  lock: number
  uselist: number
  type: TaskType
  list: string
  start: string
  end?: string
}

export interface TaskUpdate {
  id?: string
  token?: string
  taskid?: string
  user: string
  title: string
  content?: string
  files: string
  week: number
  lock: number
  uselist: number
  start: string
  end?: string
}

export interface TaskUpdateList {
  id?: string
  token?: string
  taskid?: string
  list: string
}