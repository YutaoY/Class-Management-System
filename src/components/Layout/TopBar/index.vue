<template>
  <div class="top-bar" :style="{ width: topBarWidth() }">
    <div style="width: 100%;display: flex;justify-content: center;padding-top: 10px;background-color: white;"
      v-if="!allLoading">
      <el-alert title="后台数据加载中..." type="info" effect="dark" :closable="false" style="width: 98%;" />
    </div>
    <div class="menu">
      <div class="left" style="display: flex">
        <svg class="svg-icon" aria-hidden="true" @click="toHome()">
          <use xlink:href="#icon-zhaopian-copy"></use>
        </svg>
        <i class="menu-btn btn iconfont-sys" @click="visibleMenu" v-if="showMenuButton" id="menu-btn">&#xe6ba;</i>
        <i class="refresh btn iconfont-sys" @click="reload()" v-if="showRefreshButton">&#xe6b3;</i>
        <breadcrumb v-if="showCrumbs" />
      </div>

      <div class="right">
        <!-- <div class="search-wrap">
          <div class="search-input" @click="openSearchDialog">
            <div class="left">
              <i class="iconfont-sys">&#xe710;</i>
              <span>{{ $t('topBar.search.title') }}</span>
            </div>
            <div class="search-keydown">
              <i class="iconfont-sys" v-if="isWindows">&#xeeac;</i>
              <i class="iconfont-sys" v-else>&#xe9ab;</i>
              <span>k</span>
            </div>
          </div>
        </div> -->

        <div class="screen" @click="fullScreenFun" v-if="!isFullScreen">
          <i class="iconfont-sys btn">&#xe8ce;</i>
        </div>
        <div class="screen" @click="exitScreenFun" v-else>
          <i class="iconfont-sys btn">&#xe62d;</i>
        </div>
        <!-- <div class="notice notice-btn" @click="visibleNotice">
          <i class="iconfont-sys notice-btn btn">&#xe6c2;</i>
          <span class="count notice-btn"></span>
        </div> -->

        <!-- <div class="lang" v-if="showLanguage">
          <el-dropdown @command="changeLanguage">
            <i class="iconfont-sys btn">&#xe611;</i>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh">
                  <span class="menu-txt">中文</span>
                </el-dropdown-item>
                <el-dropdown-item command="en">
                  <span class="menu-txt">English</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
</el-dropdown>
</div> -->

        <!-- <div class="setting-btn" @click="openSetting" style="display: none;">
          <el-popover :visible="showSettingGuide" placement="bottom-start" :width="190" :offset="0">
            <template #reference>
              <i class="iconfont-sys btn">&#xe6d0;</i>
            </template>
            <template #default>
              <p>点击这里查看<span :style="{ color: systemThemeColor }"> 主题风格 </span>、
                <span :style="{ color: systemThemeColor }"> 开启顶栏菜单 </span>等更多配置
              </p>
            </template>
          </el-popover>
        </div> -->

        <div @click="appReload">
          <i class="iconfont-sys btn">&#xe64b;</i>
        </div>

        <div class="dev" style="margin-right: 1em;">
          <el-badge :value="online.length" color="green" :offset="[0, 20]">
            <el-tag type="warning" color="#8932cd" effect="dark" v-if="isdevelopment">
              当前为开发环境
            </el-tag>
            <el-tag type="success" effect="plain" v-else>
              班级在线人数
            </el-tag>
          </el-badge>
        </div>

        <div class="name">
          <el-tag :type="getTagType(userInfo.power as number)">
            {{ userInfo.name }}
          </el-tag>
        </div>

        <div class="user">
          <el-popover placement="bottom-end" :width="210" :hide-after="0" :offset="20" trigger="hover"
            :show-arrow="false" popper-class="user-menu-popover"
            popper-style="border: 1px solid var(--art-border-dashed-color); border-radius: 10px; padding: 5px 16px; 5px 16px;">
            <template #reference>
              <el-avatar class="cover" :src="userInfo.avatar" id="avatar-btn">
                <img :src="avatar" />
              </el-avatar>
            </template>
            <template #default>
              <div class="user-menu-box">
                <div class="user-head">
                  <el-avatar class="cover" :src="userInfo.avatar" style="float: left">
                    <img :src="avatar" />
                  </el-avatar>
                  <div class="user-wrap">
                    <span class="name">{{ userInfo.name }}</span>
                  </div>
                </div>
                <ul class="user-menu">
                  <li @click="goPage('/user/user')">
                    <i class="menu-icon iconfont-sys">&#xe734;</i>
                    <span class="menu-txt">{{ $t('topBar.user[0]') }}</span>
                  </li>
                  <!-- <li @click="toDocs()">
                    <i class="menu-icon iconfont-sys" style="font-size: 15px">&#xe828;</i>
                    <span class="menu-txt">{{ $t('topBar.user[1]') }}</span>
                  </li>
                  <li @click="toGithub()">
                    <i class="menu-icon iconfont-sys">&#xe8d6;</i>
                    <span class="menu-txt">{{ $t('topBar.user[2]') }}</span>
                  </li> -->
                  <li @click="loginOut">
                    <i class="menu-icon iconfont-sys">&#xe780;</i>
                    <span class="menu-txt">{{ $t('topBar.user[3]') }}</span>
                  </li>
                </ul>
              </div>
            </template>
          </el-popover>
        </div>
      </div>
    </div>
    <slot></slot>

    <Notice v-model:value="showNotice" ref="notice" />
  </div>
</template>

<script setup lang="ts">
import Breadcrumb from '../Breadcrumb/index.vue'
import Notice from '../Notice/index.vue'
import { LanguageEnum, MenuWidth } from '@/enums/appEnum'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { fullScreen, exitScreen } from '@/utils/utils'
import { ElMessageBox } from 'element-plus'
import { HOME_PAGE } from '@/router'
import { useI18n } from 'vue-i18n'
import mittBus from '@/utils/mittBus'
import avatar from "@/assets/img/avatar/avatar.jpg";
import { online } from '@/utils/socket'

const isWindows = navigator.userAgent.includes('Windows')
const { locale } = useI18n()

const settingStore = useSettingStore()
const userStore = useUserStore()
const router = useRouter()

const isdevelopment = ref(false)

const showMenuButton = computed(() => settingStore.showMenuButton)
const showRefreshButton = computed(() => settingStore.showRefreshButton)
const showLanguage = computed(() => settingStore.showLanguage)
const menuOpen = computed(() => settingStore.menuOpen)
const showCrumbs = computed(() => settingStore.showCrumbs)
const userInfo = computed(() => userStore.getUserInfo)
const language = computed(() => userStore.language)
const isFullScreen = ref(false)
const showNotice = ref(false)
const notice = ref(null)
const systemThemeColor = computed(() => settingStore.systemThemeColor)
const showSettingGuide = computed(() => settingStore.showSettingGuide)

onMounted(() => {
  initLanguage()
  isdevelopment.value = process.env.NODE_ENV === 'development'
  document.addEventListener('click', bodyCloseNotice)
})

onUnmounted(() => {
  document.addEventListener('click', bodyCloseNotice)
})

const allLoading = computed(() => useUserStore().allLoad)

const fullScreenFun = () => {
  fullScreen()
  isFullScreen.value = true
}

const exitScreenFun = () => {
  exitScreen()
  isFullScreen.value = false
}

const appReload = () => {
  location.reload()
}

const topBarWidth = (): string => {
  return menuOpen.value ? `calc(100% - ${MenuWidth.OPEN})` : `calc(100% - ${MenuWidth.CLOSE})`
}

const visibleMenu = () => {
  settingStore.setMenuOpen(!menuOpen.value)
}

const getTagType = (value: number) => {
  switch (value) {
    case 0: return 'info'
    case 1: return 'warning';
    case 2: return 'primary';
    case 3: return 'danger';
    default: return 'info';
  }
}

const goPage = (path: string) => {
  if (path === 'loginOut') {
    loginOut()
    return
  }

  router.push(path)
}

const toDocs = () => {
  window.open('https://www.lingchen.kim/art-design-pro/docs')
}

const toGithub = () => {
  window.open('https://github.com/Daymychen/art-design-pro')
}

const toHome = () => {
  router.push(HOME_PAGE)
}

const loginOut = () => {
  ElMessageBox.confirm(
    '您确定退出登录当前账户吗？将清除所有缓存的数据。',
    '提醒', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logOut()
    })
}

const reload = (time: number = 0) => {
  setTimeout(() => {
    settingStore.reload()
  }, time)
}

const initLanguage = () => {
  locale.value = language.value
}

const changeLanguage = (lang: LanguageEnum) => {
  locale.value = lang
  userStore.setLanguage(lang)
  reload(50)
}

const openSetting = () => {
  mittBus.emit('openSetting')

  // 隐藏设置引导
  if (showSettingGuide.value) {
    settingStore.hideSettingGuide()
  }
  // 打开设置引导
  // settingStore.openSettingGuide()
}

const openSearchDialog = () => {
  mittBus.emit('openSearchDialog')
}

const bodyCloseNotice = (e: any) => {
  let { className } = e.target

  if (showNotice.value) {
    if (typeof className === 'object') {
      showNotice.value = false
      return
    }
    if (className.indexOf('notice-btn') === -1) {
      showNotice.value = false
    }
  }
}

const visibleNotice = () => {
  showNotice.value = !showNotice.value
}
</script>

<style lang="scss" scoped>
@import './style';
@import './mobile';
</style>
