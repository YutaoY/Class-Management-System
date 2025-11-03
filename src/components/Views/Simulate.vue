<template>
  <div class="page" v-if="loading">
    <div class="page-main">
      <div class="page-name">
        <div>
          <div>
            <el-text type="success">{{ handIndex + 1 }}</el-text>
            <el-text type="info">&nbsp;/&nbsp;</el-text>
            <el-text type="primary">{{ list.length }}</el-text>
          </div>
          <br>
          <h1>
            {{ userData.use(list[handIndex | 0]?.id).name }}
            <el-tag type="primary">当前：{{ getAttendanceEnum(list[handIndex].state).name }}</el-tag>
          </h1>
          <br>
          <el-input v-model="handList[handIndex].notes" style="width: 300px" placeholder="输入考勤备注" clearable />
          <el-alert type="warning" effect="dark" v-if="useLeaveInfo(user).length" style="margin-top: 1em;"
            :closable="false">
            <template #title>
              <el-space wrap>
                本成员已提交请假报备
                <el-link :underline="false" type="primary" @click="showPreview = true">查看</el-link>
                <el-link :underline="false" type="success" @click="setLeaveInfo">使用报备信息</el-link>
              </el-space>
            </template>
          </el-alert>
        </div>
      </div>
      <div class="page-handle">
        <el-dropdown trigger="click" placement="top" @command="updateClick">
          <el-button type="danger" :icon="CloseBold">
            未到
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="AttendanceEnum.CD">迟到</el-dropdown-item>
              <el-dropdown-item :command="AttendanceEnum.ZT">早退</el-dropdown-item>
              <el-dropdown-item :command="AttendanceEnum.SJ">事假</el-dropdown-item>
              <el-dropdown-item :command="AttendanceEnum.BJ">病假</el-dropdown-item>
              <el-dropdown-item :command="AttendanceEnum.KK">旷课</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="info" @click="nextIndex">不更改，跳过</el-button>
        <el-button type="success" @click="updateClick(AttendanceEnum.YD)" class="el-icon--right"
          :icon="Select">已到</el-button>
      </div>
    </div>
    <el-image-viewer v-if="showPreview" :url-list="[srcList]" show-progress @close="showPreview = false" />
  </div>
</template>

<script setup lang='ts'>
import { AttendanceEnum, getAttendanceEnum } from '@/enums/classEnum';
import { LeaveInfo } from '@/store/modules/leave';
import { AttendanceType } from '@/types/store';
import { userData } from '@/utils/data';
import { emitter } from '@/utils/event';
import { Select, CloseBold } from '@element-plus/icons-vue'

const handIndex = ref(0)
const loading = ref(false)
const showPreview = ref(false)
const handList = ref<AttendanceType[]>([])

const srcList = computed(() => {
  return `${import.meta.env.VITE_API_URL}/public/leave/${useLeaveInfo.value(user)[0].md5}`
})

const { list, user, taskid, leave } = defineProps({
  list: {
    type: Object as () => AttendanceType[],
    default: [],
  },
  leave: {
    type: Object as () => LeaveInfo[],
    default: [],
  },
  user: {
    type: Object as () => string,
    default: 0,
  },
  taskid: {
    type: Object as () => string,
    default: '',
  }
});

const useLeaveInfo = computed(() => (userid: string) => {
  return leave.filter(item => item.user === userid)
})

const setLeaveInfo = () => {
  const info = useLeaveInfo.value(user)[0]
  handList.value[handIndex.value].notes = info.text
  updateClick(info.type === '病假' ? AttendanceEnum.BJ : AttendanceEnum.SJ)
}

onMounted(() => {
  handList.value = [...list]
  handIndex.value = user === '' ? 0 : list.findIndex(item => item.id === user)
  nextTick(() => {
    loading.value = true
  })
})

const updateClick = (hand: AttendanceEnum) => {
  handList.value[handIndex.value].state = hand
  nextIndex()
}

const nextIndex = () => {
  if (handIndex.value >= list.length - 1)
    return returnData()
  handIndex.value++;
}

const returnData = () => {
  emitter.emit('simulateList', taskid)
}

</script>

<style lang="scss" scoped>
.page {
  width: 100%;

  .page-main {
    width: 100%;
    display: flex;
    flex-direction: column;

    .page-name {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .page-handle {
      width: 100%;
      display: flex;
      margin-top: 3em;
      justify-content: space-evenly;
    }
  }
}
</style>