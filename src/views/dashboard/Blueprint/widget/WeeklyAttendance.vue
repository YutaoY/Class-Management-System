<template>
  <div class="region sales-overview console-box">
    <div class="card-header">
      <div class="title">
        <h4>每周
          {{ getAttendanceEnum(JSON.parse(selectValue)).name }}
          {{ JSON.parse(selectValue) === AttendanceEnum.YD ? "率(%)" : "次数" }}</h4>
      </div>
      <el-select v-model="selectValue" placeholder="考勤类型" style="width: 200px">
        <el-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="chart" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import echarts from '@/plugins/echarts'
import { useECharts } from '@/utils/echarts/useECharts'
import { hexToRgba } from '@/utils/utils'
import { useSettingStore } from '@/store/modules/setting'
import { SystemThemeEnum, TaskType } from '@/enums/appEnum'
import { AttendanceEnum, getAttendanceEnum } from '@/enums/classEnum'
import { SelectOption, TaskInfo } from '@/types/store'
import { taskData } from '@/utils/data'
import { useClassStore } from '@/store/modules/class'

const chartRef = ref<HTMLDivElement>()
const { setOptions, removeResize, resize } = useECharts(chartRef as Ref<HTMLDivElement>)

const store = useSettingStore()
const classStore = useClassStore()
const theme = computed(() => store.systemThemeType)
const classInfo = computed(() => classStore.getClassInfo)
const isLight = computed(() => theme.value === SystemThemeEnum.LIGHT)
const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)

const selectValue = ref<string>(JSON.stringify(AttendanceEnum.YD));
const selectOptions = ref<SelectOption[]>([])

interface WeeklyAttendanceRate {
  week: number;  // 周数
  rate: number;  // 出勤率（0-100）
  total: number; // 该周应到总人数
  arrived: number; // 该周已到总人数
}

// 收缩菜单时，重新计算图表大小
watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(() => taskData.value.all(), () => {
  startDataChart()
}, {
  deep: true
})

watch(selectValue, () => {
  startDataChart()
})

onMounted(() => {
  Object.values(AttendanceEnum).forEach((item) => {
    if (typeof item !== 'number') return
    selectOptions.value.push({
      value: JSON.stringify(item),
      label: getAttendanceEnum(item as AttendanceEnum).name
    })
  })
  selectValue.value = selectOptions.value[0].value;
  startDataChart()
})

onUnmounted(() => {
  removeResize()
})

const getCssVariable = (str: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(str)
}

const startDataChart = () => {
  const result = calculateWeeklyAttendanceRate();

  let xAxisData: string[] = [];
  let seriesData: number[] = [];

  result.forEach((item) => {
    xAxisData.push('第' + item.week + '周');
    seriesData.push(JSON.parse(selectValue.value) === AttendanceEnum.YD ? item.rate : item.arrived);
  })

  createChart(xAxisData, seriesData)
}

/**
 * 计算每周的综合出勤率（合并所有课程数据）
 * @param tasks 原始考勤数据
 * @returns 按周统计的出勤率数组
 */
const calculateWeeklyAttendanceRate = (): WeeklyAttendanceRate[] => {
  const KCBnow = classInfo.value.KCB;
  const tasks = taskData.value.all().sort((a, b) => a.week - b.week)
  // 1. 按周分组，累加应到和已到人数
  const weeklyMap: Record<number, { total: number; arrived: number }> = {};

  tasks.forEach((task) => {
    if (!KCBnow) return;
    if (task.type !== TaskType.ARRIVE) return;
    if (Number(task.start) < new Date(KCBnow[0].first).getTime()) return;

    const week = task.week;
    const arrivedCount = task.list.check.filter(
      (item) => item.state === JSON.parse(selectValue.value)
    ).length;
    const totalCount = task.list.all.length;

    if (!weeklyMap[week]) {
      weeklyMap[week] = { total: 0, arrived: 0 };
    }

    weeklyMap[week].total += totalCount;
    weeklyMap[week].arrived += arrivedCount;
  });

  // 2. 转换为输出格式并计算出勤率
  const result: WeeklyAttendanceRate[] = [];
  Object.keys(weeklyMap).forEach((weekStr) => {
    const week = Number(weekStr);
    const { total, arrived } = weeklyMap[week];
    result.push({
      week,
      rate: parseFloat(((arrived / total) * 100).toFixed(2)),
      total,
      arrived,
    });
  });

  // 3. 按周数排序
  result.sort((a, b) => a.week - b.week);

  return result;
}

const createChart = (xAxisData: string[], seriesData: number[]) => {
  setOptions({
    grid: {
      left: '2.2%',
      right: '3%',
      bottom: '0%',
      top: '5px',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        show: true,
        color: '#999',
        margin: 20,
        interval: 0,
        fontSize: 13,
        fontWeight: 'bold'
      },
      axisLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        show: true,
        color: '#999',
        fontSize: 13,
        fontWeight: 'bold'
      },
      axisLine: {
        show: isLight.value ? true : false,
        lineStyle: {
          color: '#E8E8E8',
          width: 1
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: isLight.value ? '#e8e8e8' : '#333',
          width: 1,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: getAttendanceEnum(JSON.parse(selectValue.value)).name,
        color: getCssVariable('--main-color'),
        type: 'line',
        data: seriesData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2.6
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: hexToRgba(getCssVariable('--el-color-primary'), 0.2).rgba
            },
            {
              offset: 1,
              color: hexToRgba(getCssVariable('--el-color-primary'), 0.01).rgba
            }
          ])
        }
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.region {
  box-sizing: border-box;
  width: 50%;
  height: 444px;
  padding: 20px 0 30px;

  .chart {
    box-sizing: border-box;
    width: 100%;
    height: calc(100% - 80px);
    margin-top: 30px;
  }

  .card-header {
    padding: 0 18px !important;
  }
}
</style>
