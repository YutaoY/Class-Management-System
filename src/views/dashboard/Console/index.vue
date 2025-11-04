<template>
  <div class="console">
    <el-result icon="warning" title="当前为系统管理员" sub-title="请谨慎进行每一次的操作！" v-if="useUserStore().getIsAdmin">
    </el-result>

    <template v-else>
      <el-alert :title="leaveText" :type="leaveStore.getLeaveInfo.type === '病假' ? 'success' : 'info'" effect="dark"
        style="margin-bottom: 1em;letter-spacing: 1px;" :closable="false" v-if="leaveStore.getIsLeave" />
      <!-- <CardList></CardList> -->

      <!-- <div class="column column2">
        <SalesOverview></SalesOverview>
      </div> -->

      <div class="column column3" style="margin-top: 0 !important;">
        <ActiveUser></ActiveUser>
        <Arrive />
        <Notice />
      </div>

      <div class="column">
        <Work />
      </div>
    </template>

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
            <span>项目作者</span>
            <el-text style="display: flex;align-items: center;">芋桃&nbsp;
              <el-text size="small">子止工坊技术部</el-text></el-text>
          </div>
          <div class="btn">
            <span>协助监制</span>
            <el-text style="display: flex;align-items: center;">
              Yiesc(Jss) ZGC Hpcoccs(Jthr)
            </el-text>
          </div>
          <div class="btn" @click="goPage('https://space.bilibili.com/511657380')">
            <span>哔哩哔哩</span>
            <i class="iconfont">&#xe7e7;</i>
          </div>
          <div class="btn" @click="goPage('https://github.com/YutaoY/Class-Management-System')">
            <span>开源地址</span>
            <i class="iconfont">&#xe7e7;</i>
          </div>
        </div>
      </div>
      <img class="right-img" src="@imgs/draw/draw1.png" />
    </div>

    <el-affix :offset="20" position="bottom" class="affix">
      <el-space direction="vertical">
        <el-button circle id="leave-btn" type="success" style="font-size: 0.75em" size="large" @click="leaveOpen">
          请假<br>报备
        </el-button>
        <el-button circle type="primary" size="large" @click="toAttendance"
          v-if="userInfo.power && userInfo.power > PowerType.ORDINARY">
          <el-icon :size="20">
            <Plus />
          </el-icon>
        </el-button>
      </el-space>
    </el-affix>

    <el-dialog v-model="leavedata.leaveDialogVisible" title="请假记录提交" width="500" align-center destroy-on-close
      @close="leaveClose">
      <div style="width: 100%;display: flex;height: auto;justify-content: center;" v-if="leavedata.img">
        <el-image style="width: auto; height: 300px;" :src="leavedata.img" fit="scale-down"
          :preview-src-list="[leavedata.img]" />
      </div>
      <template v-else-if="leavedata.data.pass">
        <el-descriptions title="请假信息" direction="vertical">
          <el-descriptions-item label="报备人">
            {{ userData.use(leavedata.data.user).name }}
          </el-descriptions-item>
          <el-descriptions-item label="请假时间段">
            {{ dayjs(Number(leavedata.data.start)).format('MM-DD HH:mm') }}&nbsp;-&nbsp;{{
              dayjs(Number(leavedata.data.end)).format('MM-DD HH:mm') }}
          </el-descriptions-item>
          <el-descriptions-item label="请假类型">
            <el-tag size="small">
              {{ leavedata.data.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请假事由">
            {{ leavedata.data.text }}
          </el-descriptions-item>
        </el-descriptions>
        <el-alert title="请假报备记录已通过" type="success" effect="dark" :closable="false"
          style="margin-top: 1em;letter-spacing: 1.5px;" />
      </template>
      <el-result icon="info" title="提交今日校园的请假审批通过截图，快速帮助考勤负责人记录" v-else>
        <template #icon>
          <el-image :src="leavejpg" style="width: auto; height: 100px;" />
        </template>
        <template #extra>
          <el-button type="primary" @click="leaveClick(false)">选择图片</el-button>
          <template v-if="userInfo.power === PowerType.ADMIN || userInfo.id === classInfo.JW">
            <br><br><el-link type="primary" @click="leaveClick(true)">报备班级成员</el-link>
          </template>
        </template>
      </el-result>
      <template #footer v-if="leavedata.img">
        <div class="dialog-footer">
          <el-button @click="leavedata.leaveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="leaveSend">提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import CardList from './widget/CardList.vue'
import ActiveUser from './widget/ActiveUser.vue'
import { scrollToTop } from '@/utils/utils'
import Work from './widget/Work.vue';
import Arrive from './widget/Arrive.vue';
import Notice from './widget/Notice.vue';
import leavejpg from "@/assets/img/empty/leave.jpg";
import SalesOverview from './widget/SalesOverview.vue';
import { router } from '@/router';
import { useUserStore } from '@/store/modules/user';
import { PowerType } from '@/enums/appEnum';
import { upgradeLogList } from '@/mock/upgradeLog'
import { leaveClick, leaveClose, leavedata, leaveOpen, leaveSend } from '@/utils/leave';
import dayjs from 'dayjs';
import { useLeaveStore } from '@/store/modules/leave';
import { useClassStore } from '@/store/modules/class';
import { userData } from '@/utils/data';

const leaveStore = computed(() => useLeaveStore()).value
const userInfo = computed(() => useUserStore().getUserInfo)
const classInfo = computed(() => useClassStore().getClassInfo)

const leaveText = computed(() => {
  return `【休假中...】${leaveStore.getLeaveInfo.type == "病假" ? "生病了就好好休息哦！" : ""} 于${dayjs(Number(leaveStore.getLeaveInfo.end)).format('MM月DD日 HH:mm')}结束`
})

onMounted(() => {
  if (sessionStorage.getItem("USER_LOGIN")) {
    sessionStorage.removeItem("USER_LOGIN")
    location.reload();
  }
  // 滚动到顶部
  scrollToTop()
})

const goPage = (url: string) => {
  // 跳转到新页面
  window.open(url)
}

const toAttendance = () => {
  router.push({
    path: `/task/add`
  })
}

const toVersionLog = () => {
  router.push({
    path: `/plan/index`
  })
}
</script>

<style lang="scss" scoped>
.console {
  padding-bottom: 15px;

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
