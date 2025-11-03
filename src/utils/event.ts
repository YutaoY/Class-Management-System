import { AttendanceType, ClassInfo, TaskInfo, UserRegister } from '@/types/store'
import mitt from 'mitt'

type Events = {
  updateUserList: void
  updateClassList: void
  addfile: UserRegister[]
  simulateList: string
  AppReload: void
  printPDF: void
  addWorkTip: TaskInfo
  lookDateAttendance: string
  chageDailyStatusDate: string
  switchAttendanceModeList: number
}

export const emitter = mitt<Events>()