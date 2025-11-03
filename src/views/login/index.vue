<template>
  <div class="login">
    <div class="left-wrap">
      <div class="logo">
        <svg class="icon" aria-hidden="true">
          <use xlink:href="#icon-zhaopian-copy"></use>
        </svg>
        <h1 class="title">{{ systemName }}</h1>
      </div>
      <img class="left-bg" src="@imgs/login/lf_bg.png" />
      <img class="left-img" src="@imgs/login/lf_icon.svg" />
    </div>
    <div class="right-wrap">
      <div class="header">
        <svg class="icon" aria-hidden="true">
          <use xlink:href="#icon-zhaopian-copy"></use>
        </svg>
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3>登录</h3>
          <div style="margin-top: 30px">
            <span class="input-label">账号</span>
            <el-input placeholder="请输入账号" size="large" v-model="username" clearable />
          </div>
          <div style="margin-top: 15px">
            <span class="input-label">密码</span>
            <el-input placeholder="请输入密码" size="large" v-model.trim="password" type="password" autocomplete="off"
              @keyup.enter="login" show-password clearable />
          </div>
          <div style="margin-top: 15px">
            <span class="input-label">班级</span>
            <el-autocomplete v-model="classInfo.name" :fetch-suggestions="queryClass" placeholder="请选择班级 (支持模糊搜索)"
              @select="handleSelect" @clear="classInfo.id = ''" clearable>
              <template #default="{ item }">
                <el-text>{{ item.name }}</el-text>&nbsp;&nbsp;
                <el-text size="small">{{ item.school }}</el-text>
              </template>
            </el-autocomplete>
          </div>

          <div style="margin-top: 30px">
            <div style="width: 100%;text-align: center;">
              <el-text size="small" type="info">
                江西新能源科技职业学院·24软件技术一班&nbsp;&nbsp;出品
              </el-text>
            </div>
            <el-button style="margin-top: 10px;" class="login-btn" size="large" type="primary" @click="login"
              :loading="loading">
              登录
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { HOME_PAGE } from '@/router'
import { ApiStatus } from '@/utils/http/status'
import { UserRequest } from '@/api/usersApi'
import { registerRoutes } from "@/router/index"
import { Md5 } from 'ts-md5'
import { ClassRequest } from '@/api/classApi'
import { useClassStore } from '@/store/modules/class'
import { ElLoading } from "element-plus"
import { fourDotsSpinnerSvg } from '@/assets/svg/loading'
import axios from 'axios'

const userStore = useUserStore()
const router = useRouter()
const systemName = "班级管理系统";
const classInfo = ref<{
  id: string,
  name: string,
}>({
  id: '',
  name: '',
})
const username = ref('')
const password = ref('')
const loading = ref(false)

interface ClassItem {
  id: string
  name: string
  school: string
}

const classList = ref<ClassItem[]>([])

const queryClass = (queryString: string, cb: (arg: any) => void) => {
  const results = queryString
    ? classList.value.filter(createFilter(queryString))
    : classList.value
  cb(results)
}

const handleSelect = (item: Record<string, any>) => {
  classInfo.value.id = item.id
  classInfo.value.name = item.name
}

const createFilter = (queryString: string) => {
  return (restaurant: ClassItem) => {
    return (
      restaurant.name.toLowerCase().indexOf(queryString.toLowerCase()) !== -1
    )
  }
}

const login = async () => {
  if (!username.value) {
    return ElMessage.error('请输入账号')
  }

  if (!password.value) {
    return ElMessage.error('请输入密码')
  }

  if (!classInfo.value.id) {
    return ElMessage.error('请选择班级')
  }

  loading.value = true

  const params = {
    name: username.value,
    class: classInfo.value.id,
    paw: new Md5().appendAsciiStr(password.value).end() as string
  }

  try {
    const resUserLogin = await UserRequest.login(params);
    if (resUserLogin.err === ApiStatus.success) {
      const result = resUserLogin.result;
      if (result.token) {
        const user = { ...result };
        userStore.setUserInfo(user);
        // 获取用户数据
        const resUserData = await UserRequest.get({
          id: result.id,
          userid: result.id,
          token: result.token,
        }, true);
        if (resUserData.err === ApiStatus.success) {
          if (resUserData.result.class && resUserData.result.class !== 'Administrator') {
            const resClassData = await ClassRequest.get({ classid: resUserData.result.class });
            if (resClassData.err === ApiStatus.success)
              useClassStore().setClassInfo({
                ...resClassData.result,
                KCB: JSON.parse(resClassData.result.KCB)
              });
            else ElMessage.error(resClassData.result);
          }
          sessionStorage.setItem("USER_LOGIN", Date.now().toString())
          userStore.setUserInfo(resUserData.result);
          userStore.setLoginStatus(true);
          await registerRoutes();
          if (sessionStorage.getItem("sessionPath")) {
            location.href = sessionStorage.getItem("sessionPath") as string;
          } else router.push(HOME_PAGE); // 登录成功后跳转到主页
        } else ElMessage.error(resUserData.result);
      } else ElMessage.error("登录中出错，请稍后重试！");
    } else ElMessage.error(resUserLogin.result);
  } finally {
    loading.value = false // 无论成功还是失败，都停止加载
  }
}

onMounted(() => {
  userStore.logOut();
  if (userStore.isLogin) {
    sessionStorage.setItem("USER_LOGIN", Date.now().toString())
    router.push(HOME_PAGE);
  }

  const createLoading = ElLoading.service({
    lock: true,
    text: "获取班级中...",
    background: 'rgba(0, 0, 0, 0)',
    svg: fourDotsSpinnerSvg,
    svgViewBox: '0 0 40 40'
  })

  axios.get(`${import.meta.env.VITE_API_URL}/login-class`).then(res => {
    if (res.data.err === ApiStatus.success) {
      createLoading.close();
      classList.value = res.data.result;
    } else ElMessageBox.alert(`${res.data.result}`, '', {
      confirmButtonText: '重试',
      callback: () => {
        location.reload()
      },
    })
  }).catch(() => {
    createLoading.close()
    ElNotification({
      title: '请求班级列表出错',
      message: '请求出错，请稍后重试！',
      duration: 0,
      showClose: false,
      type: 'error',
    })
  })
})
</script>

<style lang="scss" scoped>
@import './index';
</style>
