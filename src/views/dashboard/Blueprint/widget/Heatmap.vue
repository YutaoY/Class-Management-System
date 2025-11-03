<template>
  <div class="region new-user console-box">
    <div class="card-header">
      <el-select v-model="selectValue" placeholder="查看类型" style="width: 200px">
        <el-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="chart" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { SelectOption } from '@/types/store';
import { useECharts } from '@/utils/echarts/useECharts'
import { taskData } from '@/utils/data';
import { dayjs, ElMessage } from 'element-plus';
import { TaskType } from '@/enums/appEnum';
import { useSettingStore } from '@/store/modules/setting';
import { AttendanceEnum } from '@/enums/classEnum';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { emitter } from '@/utils/event';

const selectValue = ref<string>("异常");
const selectOptions = ref<SelectOption[]>([{
  value: "异常",
  label: "异常"
}, {
  value: "请假",
  label: "请假"
}])

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions, removeResize, resize, onClick } = useECharts(chartRef as Ref<HTMLDivElement>)
const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)

watch(() => taskData.value.all(), () => {
  startDataChart();
}, { deep: true })

watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(selectValue, () => {
  startDataChart();
})

onMounted(() => {
  startDataChart()
})

onUnmounted(() => {
  removeResize()
})

const startDataChart = () => {
  createChart(getYearlyAbnormalAttendance())
}

/**
 * 统计本年度每日异常考勤
 * @param tasks 原始考勤数据
 * @param targetYear 目标年份（默认当前年份）
 */
const getYearlyAbnormalAttendance = (
  targetYear: number = new Date().getFullYear()
): [string, number][] => {
  const tasks = taskData.value.all()
  const dateMap = new Map<string, number>();

  tasks.forEach(task => {
    if (task.type !== TaskType.ARRIVE) return;

    // 解析日期并检查年份
    const yearDate = dayjs(Number(task.start)).format('YYYY');
    if (yearDate !== targetYear.toString()) return;

    const dateStr = dayjs(Number(task.start)).format('YYYY-MM-DD');;
    let abnormalCount = 0;

    task.list.check.forEach(record => {
      switch (selectValue.value) {
        case "异常":
          if (
            record.state === AttendanceEnum.CD || // 迟到
            record.state === AttendanceEnum.KK || // 旷课
            record.state === AttendanceEnum.WD || // 未到
            record.state === AttendanceEnum.ZT    // 早退
          ) {
            abnormalCount++;
          }
          break;
        case "请假":
          if (
            record.state === AttendanceEnum.BJ || // 病假
            record.state === AttendanceEnum.SJ // 事假
          ) {
            abnormalCount++;
          }
          break;
      }
    });

    if (abnormalCount > 0) {
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + abnormalCount);
    }
  });

  // 按日期排序
  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * 获取异常考勤数据的最大值
 * @param data 每日异常数据
 * @returns { date: string; count: number } | null
 */
const getMaxAbnormalCount = (data: [string, number][]) => {
  if (data.length === 0) return null;

  let max = { date: data[0][0], count: data[0][1] };

  for (const [date, count] of data) {
    if (count > max.count) {
      max = { date, count };
    }
  }

  return max;
}

const createChart = (seriesData: [string, number][]) => {
  setOptions({
    title: {
      top: 30,
      left: 'center',
      text: `考勤${selectValue.value}年历图`
    },
    tooltip: {
      trigger: 'item',
      position: ['50%', '50%'],
      formatter: (params: CallbackDataParams) => {
        if (!Array.isArray(params.data)) return "";
        let str = `${params.data[0]}：${params.data[1]}次${selectValue.value}记录`
        str += `<br>点击将设为当前查看日期`
        return str;
      }
    },
    visualMap: {
      min: 0,
      max: getMaxAbnormalCount(seriesData)?.count,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      top: 65
    },
    calendar: {
      top: 120,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: '2025',
      itemStyle: {
        borderWidth: 0.5
      },
      yearLabel: { show: false }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: seriesData
    }
  })

  onClick((params: any) => {
    if (params.data) {
      const [date, count] = params.data
      emitter.emit('chageDailyStatusDate', date)
      ElMessage.success(`已将日期设为：${date}`);
    }
  })
}

</script>

<style lang="scss" scoped>
.region {
  width: 100%;
  height: 250px;
  position: relative;

  .any-table {
    box-shadow: none;
  }

  .card-header {
    width: auto;
    height: auto;
    position: absolute;
    z-index: 10;
    right: 10px;
    top: 0;
  }

  .chart {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }
}
</style>
