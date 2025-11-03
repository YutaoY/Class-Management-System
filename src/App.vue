<template>
  <el-config-provider :size="elSize" :locale="locales[language]" :z-index="3000" v-if="loading">
    <router-view v-show="!showPrintPDF"></router-view>
  </el-config-provider>

  <PrintPDF />
</template>

<script setup lang="ts">
import { useUserStore } from './store/modules/user'
import PrintPDF from '@/components/Views/PrintPDF.vue'
import zh from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { checkSystemUpgrade } from './utils/upgrade'
import { initState, saveUserData } from './utils/storage'
import { emitter } from './utils/event'
import { showPrintPDF } from './utils/share'

const loading = ref(true)
const userStore = useUserStore()
const language = computed(() => userStore.language)
const elSize = computed(() => (document.body.clientWidth >= 500 ? 'large' : 'default'))

const locales = {
  zh: zh,
  en: en
}

onBeforeMount(() => {
  setBodyClass(true)
})

onMounted(() => {
  initState()
  saveUserData()
  setBodyClass(false)
  checkSystemUpgrade()

  // ElMessageBox.alert('版本功能维护中... 【GX|SJ _2025/3/31-FILE>2.0】', '暂停访问', {
  //   // if you want to disable its autofocus
  //   // autofocus: false,
  //   showClose: false,
  //   confirmButtonText: '知道了'
  // })
})

emitter.on('AppReload', () => {
  loading.value = false
  nextTick(() => {
    loading.value = true
  })
})

// 提升暗黑主题下页面刷新视觉体验
const setBodyClass = (addClass: boolean) => {
  let el = document.getElementsByTagName('body')[0]

  if (addClass) {
    el.setAttribute('class', 'theme-change')
  } else {
    setTimeout(() => {
      el.removeAttribute('class')
    }, 300)
  }
}
</script>
