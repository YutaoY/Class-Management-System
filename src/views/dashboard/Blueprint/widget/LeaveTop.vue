<template>
  <div class="region todo-list console-box">
    <div class="card-header">
      <div class="title">请假TOP10</div>
    </div>
    <div class="chart" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { TaskType } from '@/enums/appEnum';
import { AttendanceEnum } from '@/enums/classEnum';
import { useClassStore } from '@/store/modules/class';
import { useSettingStore } from '@/store/modules/setting';
import { taskData, userData } from '@/utils/data';
import { useECharts } from '@/utils/echarts/useECharts'

const chartRef = ref<HTMLDivElement>()
const { setOptions, removeResize, resize } = useECharts(chartRef as Ref<HTMLDivElement>)
const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)
const classStore = useClassStore()
const classInfo = computed(() => classStore.getClassInfo)

interface StudentLeave {
  name: string;
  count: number;      // 违纪总次数
}

watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(() => taskData.value.all(), () => {
  startDataChart()
}, { deep: true })

onMounted(() => {
  startDataChart()
})

onUnmounted(() => {
  removeResize()
})

const startDataChart = () => {
  const result = getStudentLeaveRanking()

  let nameArr: string[] = [];
  let countArr: number[] = [];

  result.forEach((item) => {
    nameArr.push(item.name);
    countArr.push(item.count);
  })

  createChart(nameArr, countArr)
}

/**
 * 获取学生违纪次数排序
 * @returns 按违纪次数降序排列的数组
 */
const getStudentLeaveRanking = (): StudentLeave[] => {
  const KCBnow = classInfo.value.KCB;
  const tasks = taskData.value.all();
  const violationMap = new Map<string, number>();

  // 1. 统计违纪次数
  tasks.forEach(task => {
    if (!KCBnow) return;
    if (task.type !== TaskType.ARRIVE) return;
    if (Number(task.start) < new Date(KCBnow[0].first).getTime()) return;

    task.list.check.forEach(record => {
      // 仅统计违纪状态
      if ([
        AttendanceEnum.BJ,
        AttendanceEnum.SJ
      ].includes(record.state)) {
        violationMap.set(record.id, (violationMap.get(record.id) || 0) + 1);
      }
    });
  });

  // 2. 转换为数组并排序
  return Array.from(violationMap.entries())
    .map(([studentId, count]) => ({
      name: userData.value.use(studentId).name,
      count
    }))
    .sort((a, b) => b.count - a.count); // 降序排序
}

const createChart = (nameArr: string[], countArr: number[]) => {
  setOptions({
    xAxis: {
      max: 'dataMax',
      minInterval: 1,
      axisLabel: {
        show: true,
        color: '#999',
        fontSize: 13,
        fontWeight: 'bold'
      }
    },
    yAxis: {
      type: 'category',
      data: nameArr,
      inverse: true,
      animationDuration: 300,
      animationDurationUpdate: 300,
      max: 9, // only the largest 3 bars will be displayed
      axisLabel: {
        show: true,
        color: '#000',
        fontSize: 13,
        fontWeight: 'bold'
      }
    },
    series: [
      {
        realtimeSort: true,
        name: '请假Top10',
        type: 'bar',
        data: countArr,
        label: {
          show: true,
          color: '#fff',
          formatter: '{c}次',
          valueAnimation: true,
        }
      }
    ],
    animationDuration: 0,
    animationDurationUpdate: 3000,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear'
  })
}
</script>

<style lang="scss" scoped>
.todo-list {
  height: 444px;
  box-sizing: border-box;
  flex: 1;
  padding: 0 25px;
  margin-left: var(--console-margin);

  .card-header {
    display: flex;
    justify-content: space-between;
  }

  .chart {
    width: 100%;
    height: 85%;
    // margin-top: 30px;
  }
}
</style>
