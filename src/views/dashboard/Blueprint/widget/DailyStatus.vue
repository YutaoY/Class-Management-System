<template>
  <div class="region sales-overview console-box">
    <div class="card-header">
      <div class="title">
        <h4>{{ isNowDate ? "本日考勤数据汇总" : dayjs(dataTime).format("YYYY年MM月DD日") }}</h4>
        <el-link type="primary" @click="toLookDate">
          查看当天详细考勤任务
          <el-icon>
            <Position />
          </el-icon>
        </el-link>
      </div>
      <el-date-picker v-model="dataTime" type="date" placeholder="选择日期" :clearable="false" style="width: 150px;" />
      <el-button type="primary" @click="restartdataTime" v-show="!isNowDate">回到今日</el-button>
    </div>
    <div class="top-fill">
      <LeaveBarChart></LeaveBarChart>
    </div>
    <el-divider />
    <div class="bottom-scatter">
      <AttendanceScore></AttendanceScore>
      <el-divider direction="vertical" />
      <AbnormalState></AbnormalState>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeaveBarChart from './LeaveBarChart.vue'
import AttendanceScore from './AttendanceScore.vue'
import AbnormalState from './AbnormalState.vue'
import dayjs from 'dayjs';
import { scrollToTop } from '@/utils/utils'
import { taskData } from '@/utils/data';
import { TaskType } from '@/enums/appEnum';
import { AttendanceEnum } from '@/enums/classEnum';
import { DailyAttendance } from '@/types/store';
import { dataDailyAttendance } from '@/utils/share';
import { emitter } from '@/utils/event';
import { router } from '@/router';

const dataTime = ref(new Date());
const isNowDate = computed(() => {
  return dayjs(dataTime.value).format("YYYY-MM-DD") == dayjs().format("YYYY-MM-DD")
});
const restartdataTime = () => dataTime.value = new Date();

onMounted(() => {
  startDataRef()
})

watch(() => taskData.value.all(), () => {
  startDataRef();
}, { deep: true })

watch(dataTime, () => {
  startDataRef();
})

const toLookDate = () => {
  setTimeout(() => {
    emitter.emit('lookDateAttendance', dayjs(dataTime.value).format("YYYY-MM-DD"))
  }, 1000)
  router.push('/task/attendance')
}

emitter.on('chageDailyStatusDate', (date: string) => {
  scrollToTop()
  dataTime.value = new Date(date)
})

const startDataRef = () => {
  dataDailyAttendance.value = getDailyAttendance(dataTime.value);
}

/**
 * 获取当天考勤数据
 * @param tasks 所有考勤任务
 * @param targetDate 目标日期（可选，默认当天）
 */
function getDailyAttendance(
  targetDate: Date = new Date()
): DailyAttendance {
  const tasks = taskData.value.all()
  const dateStr = dayjs(targetDate).format('YYYY-MM-DD');
  let totalStudents = 0;
  let arrivedCount = 0;

  const statusStats: {
    arrived: string[];
    late: string[];
    sickLeave: string[];
    personalLeave: string[];
    absent: string[];
    earlyLeave: string[];
  } = {
    arrived: [],
    late: [],
    sickLeave: [],
    personalLeave: [],
    absent: [],
    earlyLeave: []
  };

  // 筛选当天的考勤记录
  const dailyTasks = tasks.filter(task =>
    task.type === TaskType.ARRIVE &&
    dayjs(Number(task.start)).format("YYYY-MM-DD").startsWith(dateStr)
  );

  // 统计各状态
  dailyTasks.forEach(task => {
    totalStudents += task.list.all.length;

    task.list.check.forEach(record => {
      switch (record.state) {
        case AttendanceEnum.YD:
          statusStats.arrived.push(record.id);
          arrivedCount++;
          break;
        case AttendanceEnum.CD:
          statusStats.late.push(record.id);
          break;
        case AttendanceEnum.BJ:
          statusStats.sickLeave.push(record.id);
          break;
        case AttendanceEnum.SJ:
          statusStats.personalLeave.push(record.id);
          break;
        case AttendanceEnum.KK:
          statusStats.absent.push(record.id);
          break;
        case AttendanceEnum.WD:
          statusStats.absent.push(record.id);
          break;
        case AttendanceEnum.ZT:
          statusStats.earlyLeave.push(record.id);
          break;
      }
    });
  });

  // 计算出勤率
  const attendanceRate = totalStudents > 0
    ? parseFloat(((arrivedCount / totalStudents) * 100).toFixed(2))
    : 0;

  statusStats.absent = [... new Set(statusStats.absent)];
  statusStats.arrived = [... new Set(statusStats.arrived)];
  statusStats.earlyLeave = [... new Set(statusStats.earlyLeave)];
  statusStats.late = [... new Set(statusStats.late)];
  statusStats.personalLeave = [... new Set(statusStats.personalLeave)];
  statusStats.sickLeave = [... new Set(statusStats.sickLeave)];

  return {
    date: dateStr,
    attendanceRate,
    totalStudents,
    statusStats
  };
}
</script>

<style lang="scss" scoped>
.region {
  box-sizing: border-box;
  width: calc(50% - var(--console-margin));
  height: 380px;
  padding: 20px 0 30px;

  .card-header {
    padding: 0 18px !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .top-fill {
    width: 100%;
    height: 20%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.44em;
  }

  .bottom-scatter {
    width: 100%;
    height: 50%;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    // background-color: #000;
  }
}
</style>
