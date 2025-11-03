<template>
  <div class="region active-user console-box">
    <div class="chart" ref="chartRef"></div>
    <div class="text">
      <div class="card-header">
        <h3 @click="dialogLookuserOpen" style="cursor: pointer;">
          {{ userData.use(lookuser as string).name }}
          <el-icon class="el-icon--right" v-if="classInfo.JW == userInfo.id || userInfo.power == PowerType.ADMIN">
            <arrow-down />
          </el-icon>
          的考勤概况
        </h3>
        <el-date-picker v-model="checkDay" type="daterange" unlink-panels range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" style="max-width: 260px;" :clearable="false" />
      </div>
      <p>出勤率&nbsp;<span>{{ arrivedRate }}%</span></p>
      <p style="color: #999;">
        如有疑问请咨询{{ classInfo.JW ? userData.use(classInfo.JW).name : '考勤负责人' }}，
        <el-link type="primary" @click="toLook" :underline="false">查看班级考勤汇总 ></el-link>
      </p>
    </div>
    <div class="list" style="cursor: pointer;">
      <div @click="switchAttendanceShow(0)">
        <p style="color: #409EFF;">
          {{ totalAttendance }}
        </p>
        <p><el-link underline>总次数</el-link></p>
      </div>
      <div @click="switchAttendanceShow(1)">
        <p style="color: #67C23A;">
          {{ numberOfTimesReached }}
        </p>
        <p><el-link underline>已到次数</el-link></p>
      </div>
      <div @click="switchAttendanceShow(2)">
        <p style="color: #E6A23C;">
          {{ numberOfTimesNotReached }}
        </p>
        <p><el-link underline>请假次数</el-link></p>
      </div>
      <div @click="switchAttendanceShow(3)">
        <p style="color: #F56C6C;">
          {{ unjustifiedFrequency }}
        </p>
        <p><el-link underline>违纪次数</el-link></p>
      </div>
      <div>
        <p id="active-time-click">
          <el-dropdown style="cursor: pointer;">
            <span class="el-dropdown-link">
              选择时间范围
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in shortcuts" @click="item.value()">
                  {{ item.text }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </p>
        <p>快速选择</p>
      </div>
    </div>

    <el-dialog v-model="dialogLookuserVisible" title="查询其他成员考勤概况" width="300" :close-on-click-modal="false"
      :show-close="lookuser ? true : false">
      <el-autocomplete v-model="dialogLookuserModel" :fetch-suggestions="queryClass" placeholder="请选择成员"
        @select="handleLookuserSelect" @clear="lookuser = ''" clearable>
        <template #default="{ item }">
          <div class="user" style="display: flex; align-items: center">
            <img class="avatar" :src="getAvatar(item.avatar)" />
            <div>
              <el-text class="user-name" :type="item.sex === UserSex.MALE ? 'primary' : 'danger'">
                {{ item.name }}
              </el-text>
            </div>
          </div>
        </template>
      </el-autocomplete>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useECharts } from '@/utils/echarts/useECharts'
import { useSettingStore } from '@/store/modules/setting'
import { AttendanceEnum, getAttendanceEnum } from '@/enums/classEnum'
import { getStatisticsSimulateCount, rangeDay, lookuser } from '@/utils/task'
import { useClassStore } from '@/store/modules/class'
import { ElMessage } from 'element-plus'
import { taskData, userData } from '@/utils/data'
import { useUserStore } from '@/store/modules/user'
import { router } from '@/router'
import { PowerType, UserSex } from '@/enums/appEnum'
import { getAvatar } from '@/utils/avatar'
import { UserInfo } from '@/types/store'
import { emitter } from '@/utils/event'

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions, removeResize, resize } = useECharts(chartRef as Ref<HTMLDivElement>)
const settingStore = useSettingStore()
const menuOpen = computed(() => settingStore.menuOpen)
const classStore = useClassStore()
const classInfo = computed(() => classStore.getClassInfo)
const userInfo = computed(() => useUserStore().getUserInfo)
const dialogLookuserVisible = ref(false)
const dialogLookuserModel = ref('')

const arrivedRate = ref(0);
const totalAttendance = ref(0);
const numberOfTimesReached = ref(0);
const numberOfTimesNotReached = ref(0);
const unjustifiedFrequency = ref(0);

const checkDay = ref<[Date, Date]>([new Date(), new Date()])

watch(() => checkDay.value, () => {
  const startDay = checkDay.value[0];
  const endDay = checkDay.value[1];
  rangeDay.value[0] = new Date(new Date(startDay).getFullYear(), new Date(startDay).getMonth(), new Date(startDay).getDate(), 0, 0, 0)
  rangeDay.value[1] = new Date(new Date(endDay).getFullYear(), new Date(endDay).getMonth(), new Date(endDay).getDate(), 23, 59, 59)
  reloadSimulateCount()
  createChart()
}, {
  deep: true
})

const switchAttendanceShow = (mode: number) => {
  emitter.emit('switchAttendanceModeList', mode);
}

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0).getTime();
      const end = new Date().getTime();

      checkDay.value = [new Date(start), new Date(end)]
    },
  },
  {
    text: '昨天',
    value: () => {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0).getTime() - 24 * 60 * 60 * 1000;
      const end = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59, 999).getTime() - 24 * 60 * 60 * 1000;

      checkDay.value = [new Date(start), new Date(end)]
    },
  },
  {
    text: '这周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setTime(end.getTime() - (24 * 60 * 60 * 1000 * (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)))

      checkDay.value = [new Date(start), new Date(end)]
    },
  },
  {
    text: '上周',
    value: () => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() - (now.getDay() === 0 ? 7 : new Date().getDay()));
      end.setHours(23, 59, 59, 999);

      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      checkDay.value = [new Date(start), new Date(end)]
    },
  },
  {
    text: '本学期',
    value: () => {
      if (!classInfo.value.KCB?.length) {
        ElMessage.error('请先设置课程表')
        const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0);
        const end = new Date();

        checkDay.value = [new Date(start), new Date(end)]
      } else {
        const end = new Date()
        const firstItem = classInfo.value.KCB[0]
        const start = new Date(firstItem.first as string)
        start.setHours(0, 0, 0)

        checkDay.value = [new Date(start), new Date(end)]
      }
    },
  },
  {
    text: '全部',
    value: () => {
      const end = new Date()
      const start = new Date(0, 0, 0)
      start.setHours(0, 0, 0)

      checkDay.value = [new Date(start), new Date(end)]
    },
  },
]

const toLook = () => {
  router.push({
    path: `/task/attendance`
  })
}

const store = useSettingStore()
const isDark = computed(() => store.isDark)

// 收缩菜单时，重新计算图表大小
watch(menuOpen, () => {
  const delays = [100, 200, 300]
  delays.forEach((delay) => {
    setTimeout(resize, delay)
  })
})

watch(() => taskData.value.all(), () => {
  createChart();
  reloadSimulateCount();
}, {
  deep: true
})

watch(lookuser, () => {
  createChart();
  reloadSimulateCount();
})

const reloadSimulateCount = () => {
  totalAttendance.value = getStatisticsSimulateCount.value().length;
  numberOfTimesReached.value = getStatisticsSimulateCount.value(AttendanceEnum.YD).length + getStatisticsSimulateCount.value(AttendanceEnum.CD).length;
  numberOfTimesNotReached.value = getStatisticsSimulateCount.value(AttendanceEnum.BJ).length + getStatisticsSimulateCount.value(AttendanceEnum.SJ).length;
  unjustifiedFrequency.value = getStatisticsSimulateCount.value(AttendanceEnum.ZT).length + getStatisticsSimulateCount.value(AttendanceEnum.KK).length + getStatisticsSimulateCount.value(AttendanceEnum.WD).length;
  arrivedRate.value = Math.round(numberOfTimesReached.value / totalAttendance.value * 100) | 0;
}

const dialogLookuserOpen = () => {
  if (classInfo.value.JW == userInfo.value.id || userInfo.value.power == PowerType.ADMIN)
    dialogLookuserVisible.value = true;
}

const handleLookuserSelect = (item: Record<string, any>) => {
  lookuser.value = item.id;
  dialogLookuserVisible.value = false;
}

const queryClass = (queryString: string, cb: (arg: any) => void) => {
  const results = queryString
    ? classStore.getClassList.filter(createFilter(queryString))
    : classStore.getClassList
  cb(results)
}

const createFilter = (queryString: string) => {
  return (restaurant: UserInfo) => {
    return (
      restaurant.name.toLowerCase().indexOf(queryString.toLowerCase()) !== -1
    )
  }
}

onMounted(() => {
  rangeDay.value = [
    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0),
    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59),
  ]
  reloadSimulateCount()
})

const getCssVariable = (str: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(str)
}

const createChart = () => {
  setOptions({
    grid: {
      left: '0',
      right: '4%',
      bottom: '0%',
      top: '5px',
      containLabel: true
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        show: true,
        color: isDark.value ? '#999' : '#fff',
        fontSize: 13,
        fontWeight: 'bold'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          type: 'dashed'
        }
      },
      axisLine: {
        show: false
      }
    },
    xAxis: {
      type: 'category',
      data: [
        getAttendanceEnum(AttendanceEnum.YD).name,
        getAttendanceEnum(AttendanceEnum.CD).name,
        getAttendanceEnum(AttendanceEnum.BJ).name,
        getAttendanceEnum(AttendanceEnum.SJ).name,
        getAttendanceEnum(AttendanceEnum.ZT).name,
        getAttendanceEnum(AttendanceEnum.KK).name
      ],
      boundaryGap: [0, 0.01],
      splitLine: {
        show: false
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        show: true,
        color: isDark.value ? '#999' : '#fff',
        fontSize: 13,
        fontWeight: 'bold'
      }
    },
    series: [
      {
        data: [
          computed(() => getStatisticsSimulateCount.value(AttendanceEnum.YD).length).value,
          computed(() => getStatisticsSimulateCount.value(AttendanceEnum.CD).length).value,
          computed(() => getStatisticsSimulateCount.value(AttendanceEnum.BJ).length).value,
          computed(() => getStatisticsSimulateCount.value(AttendanceEnum.SJ).length).value,
          computed(() => getStatisticsSimulateCount.value(AttendanceEnum.ZT).length).value,
          computed(() => getStatisticsSimulateCount.value(AttendanceEnum.KK).length).value + computed(() => getStatisticsSimulateCount.value(AttendanceEnum.WD).length).value,
        ],
        type: 'bar',
        label: {
          normal: {
            show: true,
            position: 'top'
          }
        },
        barMaxWidth: 20,
        color: isDark.value ? getCssVariable('--main-color') : '#fff',
        itemStyle: {
          borderRadius: [6, 6, 6, 6]
        }
      }
    ]
  })
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  removeResize()
})
</script>

<style lang="scss" scoped>
.dark {
  .region {
    .chart {
      background: none;
    }
  }
}

.region {
  box-sizing: border-box;
  width: 50%;
  height: 444px;
  padding: 16px;

  .chart {
    box-sizing: border-box;
    width: 100%;
    height: 220px;
    padding: 20px 0 20px 20px;
    // 跟随系统主色
    background-image: linear-gradient(90deg,
        var(--el-color-primary-light-1),
        var(--el-color-primary-light-3),
        var(--el-color-primary-light-1));
    border-radius: 8px;
  }

  .card-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .namelist {
      height: auto;
      max-height: 300px;
      overflow: auto;
    }

    h3 {
      margin: 0 !important;
      padding: 0 !important;
    }

    .date-picker {
      max-width: 300px;
    }
  }

  .text {
    margin-left: 3px;

    h3 {
      margin-top: 20px;
      font-size: 18px;
      font-weight: 500;
    }

    p {
      margin-top: 5px;
      font-size: 14px;

      span {
        color: rgb(82 196 26) !important;
      }

      &:last-of-type {
        height: 42px;
        margin-top: 5px;
      }
    }
  }

  .list {
    display: flex;
    justify-content: space-between;
    margin-left: 3px;

    >div {
      flex: 1;

      p {
        color: var(--art-gray-800);
        font-weight: 400;

        &:first-of-type {
          font-size: 24px;
        }

        &:last-of-type {
          font-size: 13px;
        }
      }
    }
  }
}

.user {
  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }

  >div {
    margin-left: 5px;

    .user-name {
      font-weight: 500;
    }
  }
}

@media screen and (max-width: $device-phone) {
  .dark {
    .active-user {
      .chart {
        padding: 15px 0 0 0 !important;
      }
    }
  }
}
</style>
