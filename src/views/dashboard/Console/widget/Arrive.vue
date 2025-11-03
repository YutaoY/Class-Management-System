<template>
  <div class="region dynamic console-box">
    <div class="card-header">
      <div class="title">
        <el-dropdown>
          <h4 style="cursor: pointer;display: flex;align-items: center;">
            {{ title }}&nbsp;
            <el-icon style="padding-bottom: 5px;">
              <arrow-down />
            </el-icon>
          </h4>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="switchModeList(0)">考勤</el-dropdown-item>
              <el-dropdown-item @click="switchModeList(1)">考勤：已到</el-dropdown-item>
              <el-dropdown-item @click="switchModeList(2)">考勤：请假</el-dropdown-item>
              <el-dropdown-item @click="switchModeList(3)">考勤：违纪</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-link :underline="false" type="success" v-if="userInfo.power && userInfo.power > PowerType.ORDINARY"
        @click="toAttendance">发布考勤</el-link>
    </div>

    <div class="list" v-if="taskList.length > 0 && loading">
      <div v-for="item in taskList" :key="item.id" class="item" @click="toDetail(item)">
        <el-link class="title" type="primary" truncated>
          {{ item.title }}&nbsp;·&nbsp;
          <el-text type="info" size="small">
            {{ dayjs(Number(item.start)).format("MM-DD") }}
          </el-text>
        </el-link>
        <span>
          <el-space wrap>
            <el-text size="small" :type="isSimulateState(item, true).value == AttendanceEnum.YD ? 'success' : 'danger'">
              {{ isSimulateState(item, true).name }}
            </el-text>
          </el-space>
        </span>
      </div>
    </div>
    <el-empty :image="emptypng" :image-size="250" description="暂无考勤任务" v-else />
  </div>
</template>

<script setup lang="ts">
import { PowerType } from '@/enums/appEnum';
import { AttendanceEnum } from '@/enums/classEnum';
import { router } from '@/router';
import { useUserStore } from '@/store/modules/user';
import { TaskInfo } from '@/types/store';
import { getStatisticsSimulateCount, rangeDay, isSimulateState, lookuser } from '@/utils/task';
import dayjs from 'dayjs';
import emptypng from '@/assets/img/empty/empty.png'
import { taskData } from '@/utils/data';
import { emitter } from '@/utils/event';

const mode = ref(0);
const title = ref("考勤");
const loading = ref(true);
const taskList = ref<TaskInfo[]>([])
const userInfo = computed(() => useUserStore().getUserInfo)

onMounted(() => {
  switchModeList(0);
})

watch(() => rangeDay.value, () => {
  switchModeList(mode.value)
}, {
  deep: true
})

watch(() => taskData.value.all(), () => {
  switchModeList(mode.value)
}, {
  deep: true
})

watch(lookuser, () => {
  switchModeList(mode.value)
})

const switchModeList = (key: number) => {
  mode.value = key;
  loading.value = false;
  switch (key) {
    case 0:
      title.value = "考勤";
      taskList.value = getStatisticsSimulateCount.value();
      break;
    case 1:
      title.value = "考勤：已到";
      taskList.value = [...getStatisticsSimulateCount.value(AttendanceEnum.YD), ...getStatisticsSimulateCount.value(AttendanceEnum.CD)]
      break;
    case 2:
      title.value = "考勤：请假";
      taskList.value = [...getStatisticsSimulateCount.value(AttendanceEnum.BJ), ...getStatisticsSimulateCount.value(AttendanceEnum.SJ)]
      break;
    case 3:
      title.value = "考勤：违纪";
      taskList.value = [...getStatisticsSimulateCount.value(AttendanceEnum.ZT), ...getStatisticsSimulateCount.value(AttendanceEnum.KK), ...getStatisticsSimulateCount.value(AttendanceEnum.WD)]
      break;
  }
  nextTick(() => {
    loading.value = true;
  })
}

emitter.on('switchAttendanceModeList', (data: number) => {
  switchModeList(data);
})

const toDetail = (item: TaskInfo) => {
  router.push({
    path: `/task/get`,
    query: {
      id: item.id
    }
  })
}

const toAttendance = () => {
  router.push({
    path: `/task/add`
  })
}

</script>

<style lang="scss" scoped>
.dynamic {
  height: 444px;
  box-sizing: border-box;
  flex: 1;
  padding: 0 25px;
  margin-left: var(--console-margin);

  .header {
    display: flex;
    justify-content: space-between;
  }

  .list {
    height: calc(100% - 75px);
    overflow: scroll;

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      padding: 10px 0;
      padding-right: 10px;
      border-bottom: 1px solid var(--art-border-color);

      .title {
        max-width: 75%;
      }
    }
  }
}
</style>
