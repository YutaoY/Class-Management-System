<template>
  <div class="frame" :style="{ paddingLeft, paddingTop }" ref="loadDiv">

    <!-- 左侧菜单 -->
    <menu-left></menu-left>

    <!-- 搜索组件 -->
    <search></search>

    <!-- 顶栏 -->
    <top-bar>
      <work-tab v-if="showWorkTab"></work-tab>
    </top-bar>

    <!-- 内容区域 -->
    <div class="container">
      <router-view v-if="isRefresh && isOnline" v-slot="{ Component, route }" :style="{ minHeight }">
        <transition :name="pageTransition" mode="out-in" appear>
          <keep-alive :max="10">
            <component :is="Component" :key="route.path" v-if="route.meta.keepAlive" />
          </keep-alive>
        </transition>
        <transition :name="pageTransition" mode="out-in" appear>
          <component :is="Component" :key="route.path" v-if="!route.meta.keepAlive" />
        </transition>

        <el-tour v-model="touropen" :target-area-clickable="false" @finish="updateTourVersion"
          @close="updateTourVersion">
          <el-tour-step target="#menu-btn" title="菜单" description="展开/关闭菜单" />
          <el-tour-step target="#avatar-btn" title="修改个人信息" description="设置头像、修改密码、退出登录" />
          <el-tour-step target="#active-time-click" title="快捷查看" description="点击快速选择预设的时间范围" />
          <el-tour-step target="#leave-btn" title="请假报备" description="上传请假图片，帮助考勤负责人快速处理" />
          <template #indicators="{ current, total }">
            <span>{{ current + 1 }} / {{ total }}</span>
          </template>
        </el-tour>
      </router-view>

      <!-- 网络异常提示组件 -->
      <network v-else></network>
    </div>

    <!-- 个性化设置 -->
    <setting />

    <!-- 空投盲盒 -->
    <AddWorkTip />

    <!-- 网络延迟 -->
    <div class="delay">
      <img :src="heard" :class="beatspeed" :style="`animation-duration: ${reverseMap(delay)}s`">
      <span class="text">{{ delay < 0 ? "--" : delay }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/transition.scss'
import heard from '@/assets/img/heard.png'
import { computed, ref, watch, nextTick } from 'vue'
import MenuLeft from '@comps/Layout/MenuLeft/index.vue'
import TopBar from '@comps/Layout/TopBar/index.vue'
import WorkTab from '@comps/Layout/WorkTab/index.vue'
import Setting from '@comps/Layout/Setting/index.vue'
import AddWorkTip from '@/components/Widgets/AddWorkTip.vue'
import { MenuThemeEnum, MenuWidth } from '@/enums/appEnum'
import { useMenuStore } from '@/store/modules/menu'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useClassStore } from '@/store/modules/class'
import { ElLoading, ElMessageBox } from 'element-plus'
import { delay, delayStart, socket } from '@/utils/socket'

const touropen = ref(false)
const inputRange = [1, 200];
const outputRange = [0.2, 1];

const beatspeed = computed(() => {
  if (delay.value < 0) {
    return "nonebeat";
  } return "basebeat";
})

const loadDiv = ref<HTMLDivElement>()
const loadingInstance = ElLoading.service({
  target: loadDiv.value,
  fullscreen: true,
  text: '获取数据中...',
  lock: true
})

const reverseMap = (
  value: number,
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  // 确保输入值在输入区间内
  if (value < inputMin) value = inputMin;
  if (value > inputMax) value = inputMax;

  // 计算输入值在输入区间中的比例（0到1之间）
  const inputRatio = (value - inputMin) / (inputMax - inputMin);

  // 反转比例并映射到输出区间
  const outputValue = outputMax - inputRatio * (outputMax - outputMin);

  if (value < 0) return 0;
  return outputValue;
}

const allLoading = computed(() => useUserStore().allLoad)

// 网络状态
const { isOnline } = useNetwork()

// 获取菜单和设置信息的 store
const settingStore = useSettingStore()
const menuStore = useMenuStore()

// 菜单是否打开
const menuOpen = computed(() => settingStore.menuOpen)

// 是否显示工作标签
const showWorkTab = computed(() => settingStore.showWorkTab)

// 是否需要刷新
const refresh = computed(() => settingStore.refresh)

// 页面动画
const pageTransition = computed(() => settingStore.pageTransition)

// 根据菜单是否打开来设置左侧填充宽度
const paddingLeft = computed(() => {
  const width = menuOpen.value ? MenuWidth.OPEN : MenuWidth.CLOSE
  menuStore.setMenuWidth(width) // 更新菜单宽度
  return width
})

// 根据是否显示工作标签来设置最小高度
const minHeight = computed(() => `calc(100vh - ${showWorkTab.value ? 120 : 75}px)`)

// 根据主题类型和是否显示工作标签来设置顶部填充高度
const paddingTop = computed(() => {
  const themeType = settingStore.menuThemeType
  return !allLoading.value ? '160px' : showWorkTab.value ? '110px' : themeType === MenuThemeEnum.DESIGN ? '60px' : '80px'
})

const getAllLoading = computed(() => {
  return useUserStore().load && useClassStore().load
})

const updateTourVersion = () => {
  localStorage.setItem("tour-version", `${import.meta.env.VITE_TOUR_VERSION}`)
}

// 是否刷新页面的状态
const isRefresh = ref(false)

// 监听刷新状态变化并调用 reload 函数
watch(refresh, () => {
  reload()
})

onMounted(() => {
  if (sessionStorage.getItem("sessionPath")) {
    sessionStorage.removeItem("sessionPath")
    location.reload()
  }

  const loadTimeout = setTimeout(() => {
    if (!getAllLoading.value) {
      ElMessageBox.alert('信息获取超时，请稍后再试！', '提示', {
        autofocus: false,
        confirmButtonText: '重试',
        callback: () => {
          location.reload()
        },
      })
    }
  }, 15000);

  const loadInterval = setInterval(() => {
    if (getAllLoading.value || useUserStore().getIsAdmin) {
      clearInterval(loadInterval)
      clearTimeout(loadTimeout)
      loadingInstance.close()
      socket.connect()
      delayStart()
      reload()
      if (localStorage.getItem("tour-version") != `${import.meta.env.VITE_TOUR_VERSION}`) {
        touropen.value = true
      }
    }
  }, 100);
})

// 刷新页面
const reload = () => {
  isRefresh.value = false
  nextTick(() => {
    isRefresh.value = true
  })
}
</script>

<style lang="scss" scoped>
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.22);
  }

  50% {
    transform: scale(1.22);
  }

  75% {
    transform: scale(1.22);
  }

  100% {
    transform: scale(1);
  }
}

.frame {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  padding: 108px 0 15px;
  overflow: hidden;
  background: var(--art-bg-color);
  transition: padding 0.3s ease-in-out;

  .container {
    box-sizing: border-box;
    width: calc(100% - 40px);
    margin: auto;

    // 子页面默认style
    :deep(.page-content) {
      position: relative;
      box-sizing: border-box;
      padding: 20px;
      overflow: hidden;
      background: var(--art-main-bg-color);
      border-radius: 6px;
    }
  }

  .delay {
    z-index: 9999;
    position: fixed;
    left: 10px;
    bottom: 5px;
    display: flex;
    opacity: .25;
    justify-content: center;
    align-items: center;

    img {
      width: 20px;
      height: 20px;
      animation: heartbeat 1s infinite;
    }

    .basebeat {
      animation: heartbeat 1s infinite;
    }

    .nonebeat {
      animation: none;
    }

    span {
      color: red;
      text-shadow: 0 0 2px #999;
      font-size: 16px;
      padding-left: 7.5px;
    }
  }
}

@media only screen and (max-width: $device-ipad) {
  .frame {
    width: 100%;
    min-height: 100vh;
    padding-left: 0 !important;
    overflow-y: scroll;

    .container {
      width: calc(100% - 20px);
    }
  }
}

@media only screen and (max-width: $device-phone) {
  .frame {
    .container {
      width: calc(100% - 32px);
    }
  }
}
</style>
