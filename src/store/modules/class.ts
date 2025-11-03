import { defineStore } from 'pinia';
import { ClassInfo, UserInfo } from "@/types/store";
import { getSysStorage, saveStoreStorage } from '@/utils/storage'
import { ApiStatus } from '@/utils/http/status';
import { ElMessage } from 'element-plus';
import { UserRequest } from '@/api/usersApi';
import { userData } from '@/utils/data';
import { ClassRequest } from '@/api/classApi';
import { useUserStore } from './user';

interface ClassState {
  info: Partial<ClassInfo>
  list: UserInfo[]
  load: boolean
}

export const useClassStore = defineStore({
  id: 'classStore',
  state: (): ClassState => ({
    info: {},
    list: [],
    load: false
  }),
  getters: {
    getClassInfo(): Partial<ClassInfo> {
      return this.info
    },
    getClassList(): UserInfo[] {
      return this.list
    },
    getClassLoad(): Boolean {
      return this.load
    },
  },
  actions: {
    async initState() {
      let sys = getSysStorage()

      if (sys) {
        sys = JSON.parse(sys)
        const { info } = sys.class
        this.info = info || {};
      }
    },
    // 用户数据持久化存储
    saveUserData() {
      saveStoreStorage({
        class: {
          info: this.info
        }
      })
    },
    logOut() {
      this.info = {}
    },
    setClassInfo(info: ClassInfo) {
      this.info = info
    },
    async getClassReInfo() {
      if (useUserStore().getIsAdmin) return;
      const resClassData = await ClassRequest.get({ classid: this.info.id });
      if (resClassData.err === ApiStatus.success)
        useClassStore().setClassInfo({
          ...resClassData.result,
          KCB: JSON.parse(resClassData.result.KCB)
        });
      else ElMessage.error(resClassData.result);
    },
    async setClassList() {
      if (this.info.id) {
        const res = await UserRequest.getAll(this.info.id);
        if (res.err === ApiStatus.success) {
          this.list = res.result
          userData.value.add(this.list)
          this.load = true
        } else ElMessage.error(res.result)
      } else this.load = true
    }
  }
})