<template>
  <div class="page-content" ref="boxDom">
    <el-watermark :font="font" :content="mark">
      <el-card style="width: 100%;" shadow="never">
        <el-space wrap :size="20">
          <el-text style="font-weight: bolder;">{{ classInfo.name }} </el-text>
          <el-date-picker v-if="!isscreenshot" v-model="checkDay" type="daterange" unlink-panels range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" style="max-width: 250px;" :clearable="false" />
          <template v-else>
            <el-text type="primary">
              {{ dayjs(checkDay[0]).format("YYYY年MM月DD日") }}
            </el-text>
            <el-text>至</el-text>
            <el-text type="primary">
              {{ dayjs(checkDay[1]).format("YYYY年MM月DD日") }}
            </el-text>
          </template>
          <el-select v-model="selectKCB" v-if="!isscreenshot && showKCB" placeholder="选择课程" style="width: 200px"
            clearable @change="filterList" @clear="filterList">
            <el-option v-for="item in classInfo.KCB![0].list" :key="item.name" :label="item.name" :value="item.name" />
          </el-select>
          <el-text type="warning" v-if="isscreenshot && selectKCB">
            {{ selectKCB }}
          </el-text>
          <el-text v-if="isscreenshot">的考勤汇总</el-text>
          <el-dropdown v-if="!isscreenshot">
            <el-button type="primary">
              快捷选择日期范围<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in shortcuts" :key="item.text" @click="item.value()">
                  {{ item.text }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-if="!isscreenshot && shareAttendanceList.length" type="success"
            @click="screenshot">保存为图片</el-button>
          <el-button v-if="!isscreenshot && shareAttendanceList.length && selectKCB && detectDeviceType() === 'Desktop'"
            @click="dialogWarnPrint = true">打印</el-button>
        </el-space>
      </el-card>
      <div class="page-list" v-if="loading && shareAttendanceList.length">
        <div v-for="(item, index) in shareAttendanceList" :key="item.date">
          <el-divider content-position="left">
            <el-space wrap>
              <el-text>{{ dayjs(item.date).format("YYYY年MM月DD日") }}</el-text>
              <el-text>{{ getWeekdayFromTimestamp(item.date) }}</el-text>
              <el-text>第{{ item.attendance[0].week }}周</el-text>
              <el-link :icon="Link" type="primary" @click="clickDialog(index)" v-if="!isscreenshot"></el-link>
            </el-space>
          </el-divider>
          <el-descriptions :title="taskitem.title" v-for="taskitem in item.attendance" direction="vertical">
            <el-descriptions-item :label="classInfo.JW && taskitem.lock ? '负责人' : '发布者'">
              <el-text>{{ classInfo.JW && taskitem.lock ? userData.use(classInfo.JW).name :
                userData.use(taskitem.user).name }}
              </el-text>
            </el-descriptions-item>
            <el-descriptions-item label="考勤时间">
              {{ dayjs(Number(taskitem.start)).format("YYYY-MM-DD HH:mm") }}
            </el-descriptions-item>
            <el-descriptions-item label="我的状态" v-show="!isscreenshot">
              <el-button :type="isSimulateState(taskitem).value == AttendanceEnum.YD ? 'success' : 'danger'"
                size="small" @click="toDetail(taskitem)">
                {{ isSimulateState(taskitem).name }}</el-button>
            </el-descriptions-item>
            <el-descriptions-item label="考勤情况">
              <el-space wrap :size="15">
                <el-text>应到：
                  <el-text type="success">
                    {{ taskitem.list.check.length }}人
                  </el-text>
                </el-text>
                <el-text>实到：
                  <el-text
                    :type="taskitem.list.check.length === getAttendanceYD(taskitem).length ? 'success' : 'warning'">
                    {{ getAttendanceYD(taskitem).length }}人
                  </el-text>
                </el-text>
                <el-text v-if="getAttendanceQJ(taskitem).length">
                  <el-text type="primary">
                    请假({{ getAttendanceQJ(taskitem).length }}人)：
                  </el-text>
                  <el-space wrap spacer="、" :size="0">
                    <el-text v-for="item in getAttendanceQJ(taskitem)" :key="item.id"
                      :tag="useLeaveInfo(item.id, taskitem).length > 0 ? 'b' : 'span'">
                      {{ userData.use(item.id).name }}
                    </el-text>
                  </el-space>
                </el-text>
                <el-text v-if="getAttendanceWJ(taskitem).length">
                  <el-text type="danger">
                    旷课({{ getAttendanceWJ(taskitem).length }}人)：
                  </el-text>
                  <el-space wrap spacer="、" :size="0">
                    <el-text v-for="item in getAttendanceWJ(taskitem)" :key="item.id">
                      {{ userData.use(item.id).name }}
                    </el-text>
                  </el-space>
                </el-text>
                <el-text v-if="getAttendanceZT(taskitem).length">
                  <el-text type="danger">
                    早退({{ getAttendanceZT(taskitem).length }}人)：
                  </el-text>
                  <el-space wrap spacer="、" :size="0">
                    <el-text v-for="item in getAttendanceZT(taskitem)" :key="item.id">
                      {{ userData.use(item.id).name }}
                    </el-text>
                  </el-space>
                </el-text>
                <el-link type="info" :icon="View" :underline="false" @click="toDetail(taskitem)" v-if="!isscreenshot">详情
                  ></el-link>
              </el-space>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-result title="班级管理系统" v-show="isscreenshot">
          <template #sub-title>
            <el-space direction="vertical">
              <el-text type="info">
                江西新能源科技职业学院
              </el-text>
              <el-text type="info">
                24软件技术一班
              </el-text>
              <el-text type="info">
                技术部 出品
              </el-text>
              <br>
              <el-text type="primary">
                Tip:加粗名字表示已通过“请假报备”
              </el-text>
              <el-text type="primary">
                详细考勤数据请扫描上方二维码查看哦~
              </el-text>
            </el-space>
          </template>
          <template #icon>
            <vue-qr :text="shareURL" :size="100"></vue-qr>
          </template>
        </el-result>
      </div>
      <el-empty :image="emptypng" :image-size="250" v-else description="木的考勤任务" />

      <el-dialog v-model="dialogTableVisible" :title="dataAllList.date" width="800" destroy-on-close align-center
        class="linkdialog">
        <el-space direction="vertical" :size="30" style="width: 100%;">
          <el-text type="info" size="small">注：不包含已到考勤状态</el-text>
          <div v-if="dataAllList.attendance.QJ.length">
            <el-text type="primary">
              请假({{ dataAllList.attendance.QJ.length }}人)：
            </el-text>
            <el-space wrap spacer="、" :size="0">
              <el-text v-for="item in dataAllList.attendance.QJ" :key="item">
                {{ item }}
              </el-text>
            </el-space>
          </div>
          <div v-if="dataAllList.attendance.CD.length">
            <el-text type="info">
              迟到({{ dataAllList.attendance.CD.length }}人)：
            </el-text>
            <el-space wrap spacer="、" :size="0">
              <el-text v-for="item in dataAllList.attendance.CD" :key="item">
                {{ item }}
              </el-text>
            </el-space>
          </div>
          <div v-if="dataAllList.attendance.ZT.length">
            <el-text type="warning">
              早退({{ dataAllList.attendance.ZT.length }}人)：
            </el-text>
            <el-space wrap spacer="、" :size="0">
              <el-text v-for="item in dataAllList.attendance.ZT" :key="item">
                {{ item }}
              </el-text>
            </el-space>
          </div>
          <div v-if="dataAllList.attendance.WJ.length">
            <el-text type="danger">
              旷课({{ dataAllList.attendance.WJ.length }}人)：
            </el-text>
            <el-space wrap spacer="、" :size="0">
              <el-text v-for="item in dataAllList.attendance.WJ" :key="item">
                {{ item }}
              </el-text>
            </el-space>
          </div>
        </el-space>
        <el-empty description="无其他状况数据" :image="emptypng" :image-size="250"
          v-if="!dataAllList.attendance.QJ.length && !dataAllList.attendance.CD.length && !dataAllList.attendance.ZT.length && !dataAllList.attendance.WJ.length" />
      </el-dialog>

      <el-dialog v-model="dialogWarnPrint" title="打印须知" width="500" destroy-on-close align-center>
        <div class="dialogWarnPrint-text">
          <p
            v-for="(item, index) in ['单张考勤表只能记录25次课程。如超出，系统将从你设定的起始日期截至25次课程', '受到不同浏览器及打印机的适配，打印效果会出现偏差（线段错位、粗细不一等其他问题）']">
            <el-text type="danger">
              {{ index + 1 }}、{{ item }}
            </el-text>
          </p>
          <br><el-text type="warning">打印完毕如需回到系统，请手动刷新页面！</el-text>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogWarnPrint = false">取消</el-button>
            <el-button type="primary" @click="printPDF">我已知晓</el-button>
          </div>
        </template>
      </el-dialog>
    </el-watermark>
  </div>
</template>

<script setup lang='ts'>
import { PowerType } from '@/enums/appEnum';
import { AttendanceEnum } from '@/enums/classEnum';
import { router } from '@/router';
import { useClassStore } from '@/store/modules/class';
import { TaskInfo } from '@/types/store';
import { taskData, userData } from '@/utils/data';
import { getStatisticsSimulateCount, rangeDay, isSimulateState } from '@/utils/task';
import { dayjs, ElLoading, ElMessage } from 'element-plus';
import { Unlock, View, Link } from '@element-plus/icons-vue'
import emptypng from '@/assets/img/empty/empty.png'
import { detectDeviceType, isValidDate, scrollToBottom } from '@/utils/utils';
import { captureDivAsImage } from '@/utils/screenshot'
import { useUserStore } from '@/store/modules/user';
import vueQr from 'vue-qr/src/packages/vue-qr.vue';
import { shareAttendanceList } from '@/utils/share';
import { emitter } from '@/utils/event';
import { useLeaveStore } from '@/store/modules/leave';

interface DataAllAttendance {
  date: string,
  attendance: {
    WJ: string[]
    CD: string[]
    QJ: string[]
    ZT: string[]
  }
}

const loading = ref(false)
const isscreenshot = ref(false)
const shareURL = location.href
const showKCB = ref(false)
const selectKCB = ref('')

const routerRef = useRoute()
const dialogWarnPrint = ref(false)
const dialogTableVisible = ref(false)
const boxDom = ref<HTMLElement | null>(null)
const dataAllList = ref<DataAllAttendance>({
  date: "",
  attendance: {
    WJ: [],
    CD: [],
    QJ: [],
    ZT: []
  }
})
const checkDay = ref<[Date, Date]>([new Date(), new Date()])
const userInfo = computed(() => useUserStore().getUserInfo)
const classInfo = computed(() => useClassStore().getClassInfo)
const mark = [userInfo.value.name || '', classInfo.value.name || '']
const font = reactive({
  fontSize: 20,
  color: 'rgba(0, 0, 0, .05)'
})

watch(() => checkDay.value, () => {
  const startDay = checkDay.value[0];
  const endDay = checkDay.value[1];
  rangeDay.value[0] = new Date(new Date(startDay).getFullYear(), new Date(startDay).getMonth(), new Date(startDay).getDate(), 0, 0, 0)
  rangeDay.value[1] = new Date(new Date(endDay).getFullYear(), new Date(endDay).getMonth(), new Date(endDay).getDate(), 23, 59, 59)

  showSelectKCB()
  restartList()
}, {
  deep: true
})

watch(() => taskData.value.all(), () => {
  restartList()
}, {
  deep: true
})

const toDetail = (item: TaskInfo) => {
  router.push({
    path: `/task/get`,
    query: {
      id: item.id
    }
  })
}

const printPDF = () => {
  emitter.emit('printPDF')
}

const clickDialog = (index: number) => {
  dialogTableVisible.value = true
  dataAllList.value.attendance = {
    WJ: [],
    CD: [],
    QJ: [],
    ZT: []
  }

  dataAllList.value.date = `${dayjs(shareAttendanceList.value[index].date).format("YYYY年MM月DD日")}其他状态详细汇总`
  shareAttendanceList.value[index].attendance.forEach(item => {
    if (item.title != '晚自习') {
      getAttendanceQJ(item).forEach(item => {
        dataAllList.value.attendance.QJ.push(userData.value.use(item.id).name)
      })
      getAttendanceCD(item).forEach(item => {
        dataAllList.value.attendance.CD.push(userData.value.use(item.id).name)
      })
      getAttendanceWJ(item).forEach(item => {
        dataAllList.value.attendance.WJ.push(userData.value.use(item.id).name)
      })
      getAttendanceZT(item).forEach(item => {
        dataAllList.value.attendance.ZT.push(userData.value.use(item.id).name)
      })
    }
  })

  dataAllList.value.attendance = {
    WJ: [...new Set(dataAllList.value.attendance.WJ)],
    CD: [...new Set(dataAllList.value.attendance.CD)],
    QJ: [...new Set(dataAllList.value.attendance.QJ)],
    ZT: [...new Set(dataAllList.value.attendance.ZT)]
  }
}

const useLeaveInfo = computed(() => (userid: string, taskInfo: TaskInfo) => {
  return useLeaveStore().getLeaveCover.filter(item => item.user === userid && Number(item.start) < Number(taskInfo.start) && Number(item.end) > Number(taskInfo.start))
})

const showSelectKCB = () => {
  showKCB.value = false
  if (classInfo.value.KCB && classInfo.value.KCB.length) {
    if (rangeDay.value[0].getTime() >= new Date(classInfo.value.KCB[0].first).getTime())
      showKCB.value = true
  }
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
        ElMessage.error('请先新增课程表')
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

onMounted(() => {
  shortcuts[2].value()
  showSelectKCB()

  emitter.on('lookDateAttendance', (dateStr) => {
    if (isValidDate(dateStr)) {
      checkDay.value = [new Date(dateStr), new Date(dateStr)]
    }
  })
})

const getWeekdayFromTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[date.getDay()];
}

const filterList = () => {
  restartList()
}

const restartList = () => {
  shareAttendanceList.value = [];
  loading.value = false;
  const sortList = getStatisticsSimulateCount.value().filter(item => selectKCB.value ? item.title === selectKCB.value : true).sort((a, b) => {
    return Number(a.start) - Number(b.start)
  })

  sortList.forEach(item => {
    const startDate = new Date(Number(item.start)).setHours(0, 0, 0, 0)
    if (!shareAttendanceList.value.find(item1 => item1.date === startDate)) {
      shareAttendanceList.value.push({
        date: startDate,
        attendance: []
      })
    }

    const addIndex = shareAttendanceList.value.findIndex(item1 => item1.date === startDate);
    shareAttendanceList.value[addIndex].attendance.push(item)
  })

  nextTick(() => {
    loading.value = true
  })
}

const screenshot = () => {
  if (boxDom.value) {
    isscreenshot.value = true
    const loadingInstance = ElLoading.service({
      text: '加载中...',
      fullscreen: true
    })
    scrollToBottom(boxDom)
    nextTick(async () => {
      if (boxDom.value) {
        const name = `${classInfo.value.name}${dayjs(checkDay.value[0]).format("YYYY年MM月DD日")}至${dayjs(checkDay.value[1]).format("YYYY年MM月DD日")}考勤汇总.png`
        await captureDivAsImage(boxDom.value, name)
        isscreenshot.value = false
        loadingInstance.close()
      }
    })
  }
}

const getAttendanceYD = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.YD || item.state === AttendanceEnum.CD)
}

const getAttendanceQJ = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.SJ || item.state === AttendanceEnum.BJ)
}

const getAttendanceWJ = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.WD || item.state === AttendanceEnum.KK)
}

const getAttendanceCD = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.CD)
}

const getAttendanceZT = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.ZT)
}

</script>

<style lang="scss" scoped>
.page-content {
  width: 100%;
  height: 100%;

  .page-list {
    width: 100%;
    height: auto;
  }
}
</style>