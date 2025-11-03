<template>
  <div class="console" ref="consoleRef">
    <el-result icon="warning" title="当前为系统管理员" sub-title="请谨慎进行每一次的操作！" v-if="useUserStore().getIsAdmin">
    </el-result>

    <el-result icon="info" title="账号授权登录" sub-title="是否授权登录班级考勤可视化平台？" v-else-if="loginID">
      <template #extra>
        <div class="login-button">
          <div class="buttin-item">
            <button @click="loginID = ''" style="color: #000;">取消</button>
          </div>
          <div class="buttin-item">
            <button @click="loginWEBClick" style="background-color: #409eff;">授权</button>
          </div>
        </div>
      </template>
    </el-result>

    <el-result icon="success" title="已授权登录班级蓝图可视化平台" v-else-if="isTrueLogin"></el-result>

    <el-result icon="warning" title="看板区域显示不足" sub-title="请在大屏终端设备查看本页面！" v-else-if="!isLargeScreenTerminal">
    </el-result>

    <template v-else>
      <CardList></CardList>

      <div class="column column2">
        <DailyStatus></DailyStatus>
        <CourseAttendance></CourseAttendance>
      </div>

      <div class="column column3">
        <WeeklyAttendance></WeeklyAttendance>
        <AbsentTop />
        <LeaveTop />
      </div>

      <div class="column">
        <Heatmap />
      </div>

      <div class="bottom-wrap console-box">
        <div>
          <h2 style="display: flex;align-items: center;">
            关于班级管理系统&nbsp;
            <el-tag type="warning" effect="dark" style="cursor: pointer;" @click="toVersionLog">
              {{ upgradeLogList[0].version }}
            </el-tag>
          </h2>
          <p style="display: flex;align-items: center;">
            <el-space>
              <el-text>本系统由</el-text>
              <el-link type="primary" href="https://github.com/Daymychen/art-design-pro" target="_blank"
                :underline="false">
                art-design-pro
              </el-link>
              <el-text>模板改制</el-text>
            </el-space>
          </p>
          <p>系统包含了主要的班级管理，任务（作业、考勤）管理等...</p>

          <div class="button-wrap">
            <div class="btn">
              <span>总开发</span>
              <el-text style="display: flex;align-items: center;">易子豪&nbsp;
                <el-text size="small">九音技术开发</el-text></el-text>
            </div>
            <div class="btn">
              <span>制作组</span>
              <el-text style="display: flex;align-items: center;" truncated>24软件技术一班
                &nbsp;<el-text size="small" truncated>江西新能源科技职业学院</el-text></el-text>
            </div>
            <div class="btn"
              @click="goPage('https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkyODg4MTc5Mg==&action=getalbum&album_id=3740032765300015105#wechat_redirect')">
              <span>项目日志</span>
              <i class="iconfont">&#xe7e7;</i>
            </div>
            <div class="btn" @click="goPage('https://ninemusic.cn')">
              <span>九音官网</span>
              <i class="iconfont">&#xe7e7;</i>
            </div>
          </div>
        </div>
        <img class="right-img" src="@imgs/draw/draw1.png" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import CardList from './widget/CardList.vue'
import WeeklyAttendance from './widget/WeeklyAttendance.vue'
import { detectDeviceType, scrollToTop } from '@/utils/utils'
import Heatmap from './widget/Heatmap.vue';
import AbsentTop from './widget/AbsentTop.vue';
import LeaveTop from './widget/LeaveTop.vue';
import DailyStatus from './widget/DailyStatus.vue';
import CourseAttendance from './widget/CourseAttendance.vue';
import { router } from '@/router';
import { useUserStore } from '@/store/modules/user';
import { upgradeLogList } from '@/mock/upgradeLog'
import { useSettingStore } from '@/store/modules/setting';
import { socket } from '@/utils/socket';
import { useClassStore } from '@/store/modules/class';
import { ElMessage } from 'element-plus';
import { PowerType } from '@/enums/appEnum';

const loginID = ref();
const consoleWidth = ref(0);
const routerRef = useRoute()
const isTrueLogin = ref(false);
const consoleRef = ref<HTMLDivElement | null>();

const userStore = useUserStore()
const userInfo = computed(() => userStore.getUserInfo)
const classStore = useClassStore()
const classInfo = computed(() => classStore.getClassInfo)
const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)

onMounted(() => {
  const LOGINID = routerRef.query.login
  if (LOGINID) socket.emit('login-contract', ({
    loginID: LOGINID,
    avatar: userInfo.value.avatar,
    username: userInfo.value.name,
    classname: classInfo.value.name,
  }), (isLogin: boolean) => {
    if (isLogin) loginID.value = LOGINID
  })
  scrollToTop()
  resize()
})

// 收缩菜单时，重新计算图表大小
watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

const resize = () => {
  if (!consoleRef.value) return consoleWidth.value = 0;
  consoleWidth.value = consoleRef.value.offsetWidth;
}

const isLargeScreenTerminal = computed(() => {
  return detectDeviceType() === 'Desktop' && consoleWidth.value > 1400;
})

const loginWEBClick = () => {
  socket.emit('login-click', ({
    loginID: loginID.value,
    user: userInfo.value.id,
    class: classInfo.value.id,
    token: userInfo.value.token,
  }), (isLogin: boolean) => {
    loginID.value = "";
    if (isLogin) isTrueLogin.value = true;
    else ElMessage.error("授权码过期或失效！");
  })
}

const goPage = (url: string) => {
  // 跳转到新页面
  window.open(url)
}

const toVersionLog = () => {
  router.push({
    path: `/plan/index`
  })
}

window.addEventListener('resize', () => resize())
</script>

<style lang="scss" scoped>
.console {
  padding-bottom: 15px;

  .login-button {
    width: 300px;
    margin-top: 20px;

    .buttin-item {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;

      button {
        width: 90%;
        padding: 15px 0;
        outline: none;
        border: none;
        font-size: 16px;
        font-weight: bolder;
        color: #fff;
        border-radius: 10px;
        letter-spacing: 3px;
        box-shadow: 0 0 1px #f5f5f5;
      }
    }
  }

  :deep(.card-header) {
    display: flex;
    justify-content: space-between;
    padding: 20px 0px 10px 0;

    .title {
      h4 {
        font-size: 18px;
        font-weight: 500;
        color: var(--art-text-gray-800);
      }

      p {
        margin-top: 3px;
        font-size: 13px;

        span {
          margin-left: 10px;
          color: #52c41a;
        }
      }
    }
  }

  .region,
  .dynamic {
    background: var(--art-main-bg-color);
    border-radius: 16px;
  }

  .column {
    display: flex;
    justify-content: space-between;
    margin-top: var(--console-margin);
    background-color: transparent !important;
  }

  .bottom-wrap {
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    height: 300px;
    padding: 20px;
    margin-top: var(--console-margin);
    background: var(--art-main-bg-color);
    border-radius: 12px;

    h2 {
      margin-top: 10px;
      font-size: 20px;
      font-weight: 500;
    }

    p {
      color: var(--art-gray-700);
      margin-top: 5px;
      font-size: 14px;
    }

    .button-wrap {
      display: flex;
      flex-wrap: wrap;
      width: 1000px;
      margin-top: 35px;

      .btn {
        display: flex;
        justify-content: space-between;
        width: 380px;
        height: 50px;
        padding: 0 15px;
        margin: 0 15px 15px 0;
        font-size: 14px;
        line-height: 50px;
        text-align: center;
        cursor: pointer;
        background: var(--art-bg-color);
        border: 1px solid var(--art-border-dashed-color);
        border-radius: 5px;
        transition: all 0.3s;
        color: var(--art-gray-800);

        &:hover {
          box-shadow: 0 5px 10px rgb(0 0 0 / 5%);
          transform: translateY(-4px);
        }
      }
    }
  }
}

.affix {
  width: auto;
  position: fixed;
  right: 10px;
}
</style>

<!-- 移动端处理 -->
<style lang="scss" scoped>
.console {
  @media screen and (max-width: $device-ipad-pro) {
    .column2 {
      margin-top: 15px;

      :deep(.active-user) {
        width: 50%;
      }

      :deep(.sales-overview) {
        width: calc(50% - 15px);
      }
    }

    .column3 {
      display: flex;
      flex-wrap: wrap;
      margin-top: 15px;

      :deep(.active-user) {
        width: 100%;
        margin-top: 0;
      }

      :deep(.dynamic) {
        flex: 1;
        margin: 15px 0 0;
      }

      :deep(.todo-list) {
        flex: 1;
        margin: 15px 0 0 15px;
      }
    }

    .bottom-wrap {
      height: auto;
      margin-top: 15px;

      .button-wrap {
        width: 470px;
        margin-top: 20px;

        .btn {
          width: 180px;
        }
      }

      .right-img {
        width: 300px;
        height: 230px;
      }
    }
  }

  @media screen and (max-width: $device-ipad-vertical) {
    :deep(.card) {
      width: calc(100% + 15px);
      margin-left: -15px;

      li {
        width: calc(50% - 15px);
        margin: 0 0 15px 15px;
      }
    }

    .column2 {
      display: block;
      margin-top: 0;

      :deep(.active-user) {
        width: 100%;
      }

      :deep(.sales-overview) {
        width: 100%;
        margin-top: 15px;
      }
    }

    .column3 {
      display: block;
      margin-top: 15px;

      :deep(.new-user) {
        width: 100%;
        margin-top: 15px;
      }

      :deep(.dynamic) {
        width: 100%;
        margin: 15px 0 0;
      }

      :deep(.todo-list) {
        width: 100%;
        margin: 15px 0 0;
      }
    }

    .bottom-wrap {
      height: auto;
      margin-top: 15px;

      .button-wrap {
        width: 100%;
        margin-top: 20px;

        .btn {
          width: 190px;
          height: 50px;
          line-height: 50px;
        }
      }

      .right-img {
        display: none;
      }
    }
  }

  @media screen and (max-width: $device-phone) {
    :deep(.card) {
      width: 100%;
      margin: 0;

      li {
        width: 100%;
        margin: 0 0 15px;
      }
    }

    :deep(.active-user) {
      .chart {
        padding: 10px;
      }
    }

    .sales-overview {
      height: 300px;
      padding: 20px 15px;

      :deep(.card-header) {
        padding: 0 0 0 5px !important;
      }
    }

    .bottom-wrap {
      padding: 0 15px;

      .button-wrap {
        width: 100%;
        margin-top: 20px;

        .btn {
          width: 100%;
          margin-right: 0;
        }
      }
    }
  }
}
</style>
