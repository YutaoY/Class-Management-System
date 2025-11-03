// src/utils/echarts/useECharts.ts
import { unref, Ref, nextTick } from 'vue'
import { EChartsOption } from 'echarts'
import echarts from '@/plugins/echarts'
import { defaultOpstions } from './defaultOpstions'

export function useECharts(
  elRef: Ref<HTMLDivElement>,
  theme: 'light' | 'dark' | 'default' = 'light'
) {
  let chartInstance: echarts.ECharts | null = null
  let clickHandler: ((params: any) => void) | null = null
  let resizeHandler: () => void

  // 初始化echarts
  function initCharts() {
    const el = unref(elRef)
    if (!el) {
      return
    }
    chartInstance = echarts.init(el, theme)
    addResize()
  }

  // 配置
  function setOptions(options: EChartsOption | any) {
    // 默认配置
    if (!options.grid) {
      options.grid = defaultOpstions.grid
    }

    if (!options.tooltip) {
      options.tooltip = defaultOpstions.tooltip
    }

    if (options.yAxis) {
      const { axisLine, axisTick } = defaultOpstions.yAxis

      if (!options.yAxis.axisLine) {
        options.yAxis.axisLine = axisLine
      }
      if (!options.yAxis.axisTick) {
        options.yAxis.axisTick = axisTick
      }
    }

    if (options.xAxis) {
      const { axisLine, splitLine, axisTick } = defaultOpstions.xAxis

      if (!options.xAxis.axisLine) {
        options.xAxis.axisLine = axisLine
      }
      if (!options.xAxis.splitLine) {
        options.xAxis.splitLine = splitLine
      }
      if (!options.xAxis.axisTick) {
        options.xAxis.axisTick = axisTick
      }
    }

    if (unref(elRef).offsetHeight === 0) {
      setTimeout(() => {
        setOptions(options)
      }, 30)
      return
    }

    nextTick(() => {
      setTimeout(() => {
        if (!chartInstance) {
          initCharts()
          if (!chartInstance) return
        }
        chartInstance.setOption(options, true)
      }, 30)
    })
  }

  // 添加点击事件监听
  function onClick(callback: (params: any) => void) {
    if (!chartInstance) {
      initCharts()
    }
    // 移除之前的点击事件
    if (clickHandler) {
      chartInstance?.off('click', clickHandler)
    }
    clickHandler = callback
    chartInstance?.on('click', callback)
  }

  // 移除点击事件监听
  function offClick() {
    if (clickHandler && chartInstance) {
      chartInstance.off('click', clickHandler)
      clickHandler = null
    }
  }

  // 获取 ECharts 实例
  function getInstance() {
    return chartInstance
  }

  // 监听窗口大小变化
  function addResize() {
    resizeHandler = () => {
      resize()
    }
    window.addEventListener('resize', resizeHandler)
  }

  // 移除监听
  function removeResize() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
  }

  // 暴露 resize 方法
  function resize() {
    if (chartInstance) {
      chartInstance.resize()
    }
  }

  // 初始化时创建图表
  initCharts()

  return {
    setOptions,
    addResize,
    removeResize,
    resize,
    onClick,      // 新增的点击事件方法
    offClick,     // 新增的移除点击事件方法
    getInstance,  // 新增的获取实例方法
    echarts
  }
}
