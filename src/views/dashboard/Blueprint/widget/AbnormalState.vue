<template>
  <div class="paragraph">
    <div class="chart" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useECharts } from '@/utils/echarts/useECharts'
import { useSettingStore } from '@/store/modules/setting'
import { dataDailyAttendance } from '@/utils/share'
import { CallbackDataParams } from 'echarts/types/dist/shared'
import { userData } from '@/utils/data'

const chartRef = ref<HTMLDivElement>()
const { setOptions, removeResize, resize } = useECharts(chartRef as Ref<HTMLDivElement>)

const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)

interface SeriesData {
  value: number
  name: string
}

// 收缩菜单时，重新计算图表大小
watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(dataDailyAttendance, () => {
  startDataChart();
}, { deep: true })

onMounted(() => {
  startDataChart()
})

onUnmounted(() => {
  removeResize()
})

const startDataChart = () => {
  const data = dataDailyAttendance.value.statusStats;
  let seriesData: SeriesData[] = [];

  if (data.late.length > 0) seriesData.push({
    value: data.late.length,
    name: '迟到'
  })

  if (data.absent.length > 0) seriesData.push({
    value: data.absent.length,
    name: '旷课'
  })

  if (data.earlyLeave.length > 0) seriesData.push({
    value: data.earlyLeave.length,
    name: '早退'
  })

  createChart(seriesData, [data.late, data.absent, data.earlyLeave]);
}

const createChart = (seriesData: SeriesData[], tooltipData: [string[], string[], string[]]) => {
  setOptions({
    tooltip: {
      trigger: 'item',
      position: ['50%', '50%'],
      formatter: (params: CallbackDataParams) => {
        console.log(params);
        let str = `${params.name}： ${params.value}人<br/>`
        const namearr = params.name === "迟到" ? tooltipData[0] : params.name === "旷课" ? tooltipData[1] : tooltipData[2];
        namearr.forEach((item) => {
          str += `${userData.value.use(item).name}<br/>`
        })
        return str;
      }
    },
    legend: {
      right: '30',
      orient: 'vertical',
      top: 'middle'
    },
    series: [
      {
        name: '异常考勤占比',
        type: 'pie',
        left: '-100',
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        padAngle: 5,
        itemStyle: {
          borderRadius: 10,
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 24,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data: seriesData
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.paragraph {
  width: 50%;
  height: 100%;

  .chart {
    width: 100%;
    height: 100%;
    // margin-top: 30px;
  }
}
</style>
