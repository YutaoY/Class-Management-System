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
  createChart(dataDailyAttendance.value.attendanceRate / 100)
}

const createChart = (valueRate: number) => {
  setOptions({
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '80%'],
        radius: '125%',
        min: 0,
        max: 1,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.5, '#FF6E76'],
              [0.75, '#FDDD60'],
              // [0.9, '#58D9F9'],
              [1, '#7CFFB2']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '10%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 10,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 16,
          distance: -45,
          rotate: 'tangential',
          formatter: function (value: number) {
            if (value === 0.875) {
              return '优良';
            } else if (value === 0.625) {
              return '尚可';
            } else if (value === 0.25) {
              return '糟糕';
            }
            // if (value === 0.875) {
            //   return '极佳';
            // } else if (value === 0.625) {
            //   return '优良';
            // } else if (value === 0.375) {
            //   return '尚可';
            // } else if (value === 0.125) {
            //   return '糟糕';
            // }
            return '';
          }
        },
        title: {
          offsetCenter: [0, '-10%'],
          fontSize: 16
        },
        detail: {
          fontSize: 20,
          offsetCenter: [0, '-35%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return Math.round(value * 100) + '分';
          },
          color: 'inherit'
        },
        data: [
          {
            value: valueRate || 1,
            name: '今日出勤评分'
          }
        ]
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
