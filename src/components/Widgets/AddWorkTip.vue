<template>
  <div class="page">
    <el-dialog v-model="showGift" width="500" align-center :show-close="false" :close-on-click-modal="false"
      destroy-on-close style="background-color: #fff;color: white;">
      <template #header="{ close, titleId, titleClass }">
        <div class="show-header" style="width: 100%;text-align: center;">
          <div :id="titleId" :class="titleClass">
            <span class="title">空投盲盒</span>
          </div>
        </div>
      </template>
      <div class="show-content" @click="clickGift">
        <img :src="Gift" style="cursor: pointer;">
      </div>
      <template #footer>
        <div class="show-footer">
          <span>点击礼盒拆开查看吧！</span>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="openGift" width="1000" align-center destroy-on-close :show-close="false"
      style="background: radial-gradient(circle, rgba(63,94,251,1) 0%, rgba(252,70,107,1) 100%);cursor: pointer;">
      <template #header="{ close, titleId, titleClass }">
        <div class="open-header" style="width: 100%;text-align: center;">
          <div :id="titleId" :class="titleClass">
            <span class="title">恭喜您获得</span>
          </div>
        </div>
      </template>
      <div class="open-content" @click="toDetail(taskInfo?.id as string)">
        <img :src="kaixiang" style="opacity: 0.3;">
        <div class="content">
          <p class="name">{{ taskInfo?.title }}*1</p>
          <el-divider>限时作业奖品</el-divider>
          <p class="text">作业截止时间：{{ dayjs(Number(taskInfo?.end)).format("YYYY年MM月DD日 HH:mm:ss") }}</p>
        </div>
      </div>
      <template #footer>
        <div class="open-footer">
          <span>点击任意空白处关闭</span>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang='ts'>
import Gift from '@/assets/img/gift.png'
import kaixiang from '@/assets/img/kaixiang.png'
import { router } from '@/router';
import { TaskInfo } from '@/types/store';
import { taskData } from '@/utils/data';
import { emitter } from '@/utils/event';
import dayjs from 'dayjs';
const showGift = ref(false)
const openGift = ref(false)

const taskInfo = ref<TaskInfo>()

emitter.on('addWorkTip', (task: TaskInfo) => {
  showGift.value = true
  taskInfo.value = task;
})

const clickGift = () => {
  showGift.value = false
  nextTick(() => {
    toDetail(taskInfo.value?.id as string)
    setTimeout(() => {
      openGift.value = true
    }, 2000);
    setTimeout(() => {
      taskData.value.add(taskInfo.value as TaskInfo);
    }, 3000);
  })
}

const toDetail = (taskid: string) => {
  sessionStorage.setItem('gift', taskid)
  router.push({
    path: `/task/get`,
    query: {
      id: taskid,
    }
  })
}

</script>

<style lang="scss" scoped>
.page {
  width: 100%;

  .show-header {
    width: 100%;
    padding: 1.44em 0;

    .title {
      color: #000;
      font-size: 1.82em;
    }
  }

  .show-content {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 144px;
      height: 144px;
    }
  }

  .show-footer {
    width: 100%;
    color: #999;
    padding: 10px 0;
    text-align: center;
  }

  .open-header {
    width: 100%;
    padding: 1.44em 0;

    .title {
      color: #eee;
      font-size: 1.44em;
    }
  }

  .open-content {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    img {
      width: 175px;
      height: 175px;
    }

    .content {
      width: auto;
      height: auto;
      position: absolute;

      text-align: center;

      .name {
        color: #000;
        font-size: 3.8em;
        letter-spacing: 10px;
        -webkit-text-stroke: 1px #fff;
      }

      .text {
        color: #ddd;
        margin-top: 1.44em;
        text-shadow: 0 0 5px #000;
      }
    }
  }

  .open-footer {
    width: 100%;
    color: #999;
    padding: 10px 0;
    text-align: center;
  }

}
</style>