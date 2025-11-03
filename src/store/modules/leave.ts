import { defineStore } from 'pinia'
import { ApiStatus } from '@/utils/http/status'
import { LeaveRequest } from '@/api/leaveApi'
import { ElMessage } from 'element-plus'
import { useUserStore } from './user'
import { useClassStore } from './class'

export interface LeaveInfo {
  id: string
  user: string
  class: string
  md5: string
  time: string
  start: string
  end: string
  type: string
  text: string
}

export interface LeaveCover {
  id: string
  user: string
  start: string
  end: string
  type: string
}

export interface LeaveState {
  list: LeaveInfo[]
  cover: LeaveCover[]
}

export const useLeaveStore = defineStore({
  id: 'leaveStore',
  state: (): LeaveState => ({
    list: [],
    cover: []
  }),
  getters: {
    getIsLeave(): Boolean {
      return this.list.filter(item => Date.now() > Number(item.start) && Date.now() < Number(item.end)).length > 0
    },
    getLeaveList(): LeaveInfo[] {
      return this.list
    },
    getLeaveCover(): LeaveCover[] {
      return this.cover
    },
    getLeaveInfo(): LeaveInfo {
      return this.getIsLeave ? this.list.filter(item => Date.now() > Number(item.start) && Date.now() < Number(item.end))[0] : {
        id: '',
        user: '',
        class: '',
        md5: '',
        time: '',
        start: '',
        end: '',
        type: '',
        text: ''
      }
    },
  },
  actions: {
    async setList() {
      if (!useUserStore().isLogin) return
      const resSelf = await LeaveRequest.get()
      if (resSelf.err === ApiStatus.success) {
        this.list = resSelf.result
      }
      const classID = useClassStore().info.id as string;
      const resCover = await LeaveRequest.cover({
        class: classID
      })
      if (resCover.err === ApiStatus.success) {
        this.cover = resCover.result
      }
    },
    addList(item: LeaveInfo) {
      this.list.push(item)
    },
    async initState() {
      this.setList()
    },
  }
})
