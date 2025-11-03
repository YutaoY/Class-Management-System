import { DailyAttendance, TaskInfo } from "@/types/store"

interface DateAttendance {
  date: number,
  attendance: TaskInfo[]
}

export const dataDailyAttendance = ref<DailyAttendance>({
  date: new Date().toString(),
  attendanceRate: 0,
  totalStudents: 0,
  statusStats: {
    arrived: [], // 已到
    late: [], // 迟到
    sickLeave: [], // 病假
    personalLeave: [], // 事假
    absent: [], // 旷课
    earlyLeave: [], // 早退
  }
})

export const shareAttendanceList = ref<DateAttendance[]>([])

export const showPrintPDF = ref(false)