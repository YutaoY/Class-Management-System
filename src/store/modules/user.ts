import { defineStore } from 'pinia'
import { LanguageEnum } from '@/enums/appEnum'
import { router } from '@/router'
import { UserInfo } from '@/types/store'
import { useSettingStore } from './setting'
import { useWorktabStore } from './worktab'
import { MenuListType } from '@/types/menu'
import { UserRequest } from '@/api/usersApi'
import { ApiStatus } from '@/utils/http/status'
import { getSysStorage, saveStoreStorage } from '@/utils/storage'
import { useClassStore } from './class'
import { useTaskStore } from './task'

interface UserState {
  load: boolean
  allLoad: boolean
  language: LanguageEnum // 语言
  isLogin: boolean // 是否登录
  info: Partial<UserInfo> // 用户信息
  searchHistory: MenuListType[] // 搜索历史
}

export const useUserStore = defineStore({
  id: 'userStore',
  state: (): UserState => ({
    load: false,
    allLoad: false,
    language: LanguageEnum.ZH,
    isLogin: false,
    info: {},
    searchHistory: []
  }),
  getters: {
    getIsAdmin(): Boolean {
      return this.info.class === 'Administrator'
    },
    getUserLoad(): Boolean {
      return this.load
    },
    getUserInfo(): Partial<UserInfo> {
      return this.info
    },
    getSettingState() {
      return useSettingStore().$state
    },
    getWorktabState() {
      return useWorktabStore().$state
    }
  },
  actions: {
    async initState() {
      let sys = getSysStorage()
      if (sys) {
        sys = JSON.parse(sys)
        const { info, isLogin, language, searchHistory } = sys.user
        this.info = info || {}
        this.isLogin = isLogin || false
        this.language = language || LanguageEnum.ZH
        this.searchHistory = searchHistory || []

        if (this.isLogin) {
          const res = await UserRequest.get({
            userid: this.info.id
          });
          if (res.err === ApiStatus.success) {
            this.load = true;
            this.info = res.result;
            if (!this.getIsAdmin) {
              await Promise.all([
                useClassStore().getClassReInfo(),
                useClassStore().setClassList(),
                useTaskStore().setTaskList()
              ]);
            }
            this.allLoad = true;
          }
        }
      }
    },
    // 用户数据持久化存储
    saveUserData() {
      saveStoreStorage({
        user: {
          info: this.info,
          isLogin: this.isLogin,
          language: this.language,
          searchHistory: this.searchHistory,
          worktab: this.getWorktabState,
          setting: this.getSettingState
        }
      })
    },
    setUserInfo(info: UserInfo) {
      this.info = info
    },
    setLoginStatus(isLogin: boolean) {
      this.isLogin = isLogin
    },
    setLanguage(lang: LanguageEnum) {
      this.language = lang
    },
    setSearchHistory(list: Array<MenuListType>) {
      this.searchHistory = list
    },
    logOut() {
      document.getElementsByTagName('html')[0].removeAttribute('class') // 移除暗黑主题

      setTimeout(() => {
        const tourStorage = localStorage.getItem("tour-version");
        this.info = {}
        this.isLogin = false
        this.searchHistory = []
        useWorktabStore().opened = []
        this.saveUserData()
        localStorage.clear()
        if (tourStorage) localStorage.setItem("tour-version", tourStorage)
        router.push('/login')
      }, 300)
    }
  }
})
