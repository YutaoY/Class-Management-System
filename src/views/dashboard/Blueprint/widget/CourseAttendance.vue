<template>
  <div class="region sales-overview console-box">
    <div class="card-header">
      <div class="title">
        <h4>每周课程出勤率(%)</h4>
      </div>
      <el-select v-model="selectValue" placeholder="选择课程" style="width: 200px" multiple collapse-tags>
        <el-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button-group>
        <el-button type="default" @click="selectAllClear">清空</el-button>
        <el-button type="primary" @click="selectAllCheck">全选</el-button>
      </el-button-group>
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
import { SelectOption, TaskInfo } from '@/types/store'
import { AttendanceEnum } from '@/enums/classEnum'
import { useClassStore } from '@/store/modules/class'
import { taskData } from '@/utils/data'

interface WeeklyAttendance {
  week: number;       // 周数
  courses: {         // 该周所有课程的考勤情况
    title: string;   // 课程名称
    rate: number;    // 出勤率（0-100）
    total: number;   // 应到人数
    arrived: number; // 已到人数
  }[];
}[];

interface LineSeriesData {
  name: string;  // 课程名称
  type: 'line';  // 图表类型（折线图）
  data: (number | null)[]; // 每个周数的出勤率（无数据的周用 null 或 0 填充）
}[];

const chartRef = ref<HTMLDivElement>()
const { setOptions, removeResize, resize } = useECharts(chartRef as Ref<HTMLDivElement>)

const store = useSettingStore()
const classStore = useClassStore()
const theme = computed(() => store.systemThemeType)
const classInfo = computed(() => classStore.getClassInfo)
const isLight = computed(() => theme.value === SystemThemeEnum.LIGHT)
const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)

const selectValue = ref<string[]>([])
const selectOptions = ref<SelectOption[]>([]);

// 收缩菜单时，重新计算图表大小
watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(selectValue, () => {
  startDataChart()
})

watch(() => taskData.value.all(), () => {
  startDataChart()
}, {
  deep: true,
})

onMounted(() => {
  const KCBnow = classInfo.value.KCB;
  if (!KCBnow) return;

  KCBnow[0].list.forEach((item) => {
    selectOptions.value.push({
      value: item.name,
      label: item.name
    })

    selectValue.value.push(item.name)
  })

  startDataChart()
})

onUnmounted(() => {
  removeResize()
})

const selectAllCheck = () => {
  selectValue.value = []
  selectOptions.value.forEach((item) => {
    selectValue.value.push(item.value)
  })
}

const selectAllClear = () => {
  selectValue.value = []
}

const startDataChart = async () => {
  const result = getWeeklyCourseAttendance();

  let legendData: string[] = []; //课程名
  let xAxisData: string[] = []; //周数
  const seriesData = await convertToLineSeries(result);

  for (let index = 0; index < seriesData[0].data.length; index++) {
    xAxisData.push((index + 1) + '周');
  }

  seriesData.forEach((item) => {
    legendData.push(item.name);
  });

  createChart(legendData, xAxisData, seriesData);
}

/**
 * 将每周课程出勤数据转换为折线图需要的格式
 * @param weeklyData 每周课程出勤数据（来自 getWeeklyCourseAttendance）
 * @param maxWeeks 总周数（用于补全缺失周数据，默认自动计算最大周数）
 */
function convertToLineSeries(
  weeklyData: WeeklyAttendance[],
  maxWeeks?: number
): LineSeriesData[] {
  // 1. 获取所有课程名称和最大周数
  const allCourses = new Set<string>();
  const weeksInData = weeklyData.map((item) => item.week);
  const calculatedMaxWeeks = maxWeeks || Math.max(...weeksInData, 0);

  weeklyData.forEach((weekData) => {
    weekData.courses.forEach((course) => {
      allCourses.add(course.title);
    });
  });

  // 2. 初始化每门课程的数据数组（用 null 填充缺失周）
  const courseDataMap: Record<string, (number | null)[]> = {};
  Array.from(allCourses).forEach((course) => {
    courseDataMap[course] = Array(calculatedMaxWeeks).fill(null);
  });

  // 3. 填充有效数据
  weeklyData.forEach((weekData) => {
    const weekIndex = weekData.week; // 转为0-based索引
    const haveWeek = taskData.value.all().filter(item => item.week === weekIndex)
    if (haveWeek.length > 0) weekData.courses.forEach((course) => {
      courseDataMap[course.title][weekIndex - 1] = course.rate;
    });
  });

  // 4. 转换为 ECharts 需要的格式
  return Array.from(allCourses).map((course) => ({
    name: course,
    type: 'line',
    data: courseDataMap[course],
  }));
}

/**
 * 按周统计所有课程的出勤率（某周无考勤则不包含）
 * @returns 按周分组的课程出勤率数组
 */
const getWeeklyCourseAttendance = (): WeeklyAttendance[] => {
  // 1. 按周数分组，记录每门课程的考勤数据
  const KCBnow = classInfo.value.KCB;
  const tasks = taskData.value.all().sort((a, b) => a.week - b.week);
  const weeklyMap: Record<number, Record<string, { total: number; arrived: number }>> = {};

  tasks.forEach((task) => {
    if (!KCBnow) return;
    if (task.type !== TaskType.ARRIVE) return;
    if (!selectValue.value.includes(task.title)) return
    if (Number(task.start) < new Date(KCBnow[0].first).getTime()) return;

    const week = task.week;
    const courseTitle = task.title;
    const arrivedCount = task.list.check.filter(
      (item) => item.state === AttendanceEnum.YD
    ).length;
    const totalCount = task.list.check.length;

    // 初始化周数据
    if (!weeklyMap[week]) {
      weeklyMap[week] = {};
    }

    // 初始化课程数据
    if (!weeklyMap[week][courseTitle]) {
      weeklyMap[week][courseTitle] = { total: 0, arrived: 0 };
    }

    // 累加数据（同一课程一周可能多次考勤）
    weeklyMap[week][courseTitle].total += totalCount;
    weeklyMap[week][courseTitle].arrived += arrivedCount;
  });

  // 2. 转换为目标格式并计算出勤率
  let result: WeeklyAttendance[] = [];
  Object.keys(weeklyMap).forEach((weekStr) => {
    const week = Number(weekStr);
    const courses = Object.keys(weeklyMap[week]).map((title) => {
      const data = weeklyMap[week][title];
      return {
        title,
        rate: parseFloat(((data.arrived / data.total) * 100).toFixed(2)),
        total: data.total,
        arrived: data.arrived,
      };
    });

    result.push({ week, courses });
  });

  // 3. 按周数排序（可选）
  result.sort((a, b) => a.week - b.week);

  return result;
}

const createChart = (legendData: string[], xAxisData: string[], seriesData: LineSeriesData[]) => {
  setOptions({
    title: {
      show: false,
      text: '课程每周出勤率'
    },
    tooltip: {
      order: 'valueDesc',
      trigger: 'axis',
    },
    legend: {
      data: legendData
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        show: true,
        color: '#999',
        fontSize: 13,
        fontWeight: 'bold'
      },
    },
    yAxis: {
      // show: false,
      name: '出勤率(%)',
      type: 'value',
      axisLabel: {
        show: true,
        color: '#999',
        fontSize: 13,
        fontWeight: 'bold'
      },
    },
    series: seriesData
  })
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

  .chart {
    width: 100%;
    height: calc(100% - 80px);
    margin-top: 30px;
  }
}
</style>
