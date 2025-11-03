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
import { TooltipComponentFormatterCallbackParams } from 'echarts'
import { CallbackDataParams } from 'echarts/types/dist/shared'
import { userData } from '@/utils/data'

const chartRef = ref<HTMLDivElement>()
const { setOptions, removeResize, resize } = useECharts(chartRef as Ref<HTMLDivElement>)

const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)

// 收缩菜单时，重新计算图表大小
watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(dataDailyAttendance, () => {
  startDataChart()
}, { deep: true })

onMounted(() => {
  startDataChart()
})

onUnmounted(() => {
  removeResize()
})

const startDataChart = () => {
  const data = dataDailyAttendance.value.statusStats;
  createChart([data.sickLeave, data.personalLeave])
}

const createChart = (seriesData: [string[], string[]]) => {
  setOptions({
    tooltip: {
      trigger: 'axis',
      position: ['50%', '50%'],
      formatter: (params: CallbackDataParams[]) => {
        let str = `${params[0].name}： ${params[0].data}人<br/>`
        const namearr = params[0].name === "病假" ? seriesData[0] : seriesData[1]
        namearr.forEach((item) => {
          str += `${userData.value.use(item).name}<br/>`
        })
        return str;
      }
    },
    xAxis: {
      show: false,
      max: 'dataMax',
      minInterval: 1,
    },
    yAxis: {
      type: 'category',
      data: ['病假', '事假'],
      inverse: true,
      animationDuration: 300,
      animationDurationUpdate: 300,
      axisLabel: {
        show: true,
        color: '#999',
        fontSize: 13,
        fontWeight: 'bold'
      },
      max: 1 // only the largest 3 bars will be displayed
    },
    series: [
      {
        realtimeSort: true,
        name: '请假类型数量',
        type: 'bar',
        data: [seriesData[0].length, seriesData[1].length],
        label: {
          show: true,
          position: 'right',
          valueAnimation: true
        }
      }
    ],
    legend: {
      show: false
    },
    animationDuration: 0,
    animationDurationUpdate: 3000,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear'
  })
}
</script>

<style lang="scss" scoped>
.paragraph {
  width: 95%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .chart {
    width: 100%;
    height: 100%;
    // margin-top: 30px;
  }
}
</style>
