<template>
  <div class="page-content article-detail">
    <template v-if="loading">
      <el-page-header @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3">
            {{ `${getTaskType(taskInfo?.type).text}详情` }}
          </span>
        </template>
      </el-page-header>
      <div class="content" v-if="taskInfo?.id">
        <div class="title">
          <el-space wrap :size="15">
            <h1>{{ taskInfo?.title }}</h1>
            <el-tag :type="getTaskType(taskInfo?.type).type">
              {{ getTaskType(taskInfo?.type).text }}
            </el-tag>
          </el-space>
        </div>
        <div style="width: 100%;margin-top: 10px;">
          <el-space wrap spacer="|">
            <div class="user" style="display: flex; align-items: center">
              <el-avatar :size="25" shape="square" :src="userData.use(taskInfo?.user).avatar">
                <img :src="avatar">
              </el-avatar>
              <div>
                <el-text class="user-name">
                  {{ userData.use(taskInfo?.user).name }}
                </el-text>
              </div>
            </div>
            <el-text>
              {{ dayjs(Number(taskInfo?.start)).format('YYYY年MM月DD日 HH:mm') }}
            </el-text>

            <!-- 作业任务信息展示 -->
            <template v-if="taskInfo?.type === TaskType.WORK">
              <el-text :type="getTaskEnd(taskInfo as TaskInfo).type">
                {{ getTaskEnd(taskInfo as TaskInfo).text }}&nbsp;·&nbsp;{{ getTaskEndDay(taskInfo as TaskInfo) }}
              </el-text>
              <el-text type="warning">
                截止时间：
                {{ dayjs(Number(taskInfo?.end)).format('YYYY年MM月DD日 HH:mm') }}
              </el-text>
              <el-link :icon="Share" type="info" @click="copyShareLink">分享</el-link>
            </template>

            <!-- 考勤任务信息展示 -->
            <template v-if="taskInfo?.type === TaskType.ARRIVE">
              <el-text type="warning">
                第{{ taskInfo.week }}周
              </el-text>
            </template>

            <!-- 通知任务信息展示 -->
            <template v-if="taskInfo?.type === TaskType.NOTICE">
              <el-text>已读：
                {{ [... new Set(taskInfo?.list.true)].length }}
                /{{ classList.length }}人
              </el-text>
              <el-text>总阅读次数：{{ taskInfo?.list.true.length }}次</el-text>
            </template>

            <template v-if="getEditPower">
              <el-link :icon="Edit" type="primary" @click="goEdit">编辑</el-link>
              <el-link :icon="Delete" type="danger" @click="deleteTask">删除</el-link>
            </template>
            <el-text v-if="taskInfo?.lock">
              <el-icon :size="15">
                <Lock />
              </el-icon>
              此任务已锁定
            </el-text>
          </el-space>
        </div>
        <div class="markdown-body" v-highlight v-html="taskInfo?.content" v-if="taskInfo?.content != '<p><br></p>'">
        </div>
        <template
          v-if="taskInfo?.lock && userInfo.id === taskInfo.user && !getEditPower && taskInfo.type !== TaskType.NOTICE">
          <br>
          <el-alert type="warning" :title="`当前任务已被负责人锁定，你无权修改`" :closable="false"
            effect="dark" show-icon />
        </template>
        <template v-if="taskInfo?.type === TaskType.WORK">
          <br>
          <template v-if="taskInfo?.uselist">
            <el-divider>
              <el-text>完成情况</el-text>&nbsp;
              <el-text type="success">
                已：{{ taskInfo?.list.true.length }}
                /{{ taskInfo?.list.all.length }}
              </el-text>&nbsp;&nbsp;
              <el-text type="danger">
                未：{{ (taskInfo?.list.all.length || 0) - (taskInfo?.list.true.length || 0) }}
                /{{ taskInfo?.list.all.length }}
              </el-text>
            </el-divider>
            <div class="handle" v-if="getEditPower">
              <div
                style="width: 100%;margin-bottom: 2em;display: flex;align-items: center;justify-content: space-between;">
                <el-space wrap :size="20">
                  <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">
                    全选
                  </el-checkbox>
                  <el-input v-model="searchname" style="width: 240px" placeholder="搜索姓名" clearable />
                </el-space>
              </div>
              <el-checkbox-group v-model="trueList" @change="handleCheckedCitiesChange">
                <el-checkbox v-for="item in allList" :key="item" :label="item" :value="item"
                  :disabled="isSearchD(userData.use(item).name)" :border="isSearchB(userData.use(item).name)">
                  {{ userData.use(item).name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="list" v-else>
              <div class="list-box" v-if="falseList.length > 0">
                <el-text type="danger">未</el-text>
                <div class="tag">
                  <el-tag v-for="item in falseList" :key="item" type="danger">
                    {{ userData.use(item).name }}
                  </el-tag>
                </div>
              </div>
              <div class="list-box" v-if="trueList.length > 0">
                <el-text type="success">已</el-text>
                <div class="tag">
                  <el-tag v-for="item in trueList" :key="item" type="success">
                    {{ userData.use(item).name }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
          <el-divider v-else>
            <el-text></el-text>
          </el-divider>
        </template>
        <template v-if="taskInfo?.type === TaskType.ARRIVE">
          <br>
          <el-divider>
            <el-text>考勤情况</el-text>&nbsp;
          </el-divider>
          <div style="width: 100%;text-align: right;" v-if="getEditPower">
            <el-space wrap :size="20">
              <el-text>点击学生名字可单独修改</el-text>
              <el-input v-model="search" style="width: 150px" placeholder="搜索成员" clearable />
              <el-button type="primary" :icon="Finished" @click="openSimulate('')">考勤</el-button>
              <el-dropdown trigger="click" placement="top" @command="handAllChageCheck">
                <el-button>全部更改
                  <el-icon class="el-icon--right">
                    <arrow-down />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="AttendanceEnum.YD">已到</el-dropdown-item>
                    <el-dropdown-item :command="AttendanceEnum.CD">迟到</el-dropdown-item>
                    <el-dropdown-item :command="AttendanceEnum.SJ">事假</el-dropdown-item>
                    <el-dropdown-item :command="AttendanceEnum.BJ">病假</el-dropdown-item>
                    <el-dropdown-item :command="AttendanceEnum.ZT">早退</el-dropdown-item>
                    <el-dropdown-item :command="AttendanceEnum.KK">旷课</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-space>
            <br><br>
          </div>
          <div class="list">
            <template v-for="list in classifyList">
              <div class="list-box" v-if="list.records.length > 0">
                <el-text :type="list.records[0].state === AttendanceEnum.YD ? 'success' : 'danger'">
                  {{ list.name }}{{ list.records.length }}
                </el-text>
                <div class="tag">
                  <template v-for="item in list.records" :key="item.id">
                    <el-tooltip effect="dark" :content="item.notes" placement="top" :disabled="item.notes === ''">
                      <el-badge :value="setBadgeValue(item)"
                        :type="useLeaveInfo(item.id).length ? 'primary' : 'warning'" style="width: 100%;"
                        :offset="[useLeaveInfo(item.id).length ? -10 : 0, 0]">
                        <el-tag
                          :type="search && userData.use(item.id).name.indexOf(search) === -1 ? 'info' : item.state === AttendanceEnum.YD ? 'success' : 'danger'"
                          @click="openSimulate(item.id)" style="cursor: pointer;width: 100%;">
                          {{ getUserIndex(item.id) + 1 }}.{{ userData.use(item.id).name }}
                        </el-tag>
                      </el-badge>
                    </el-tooltip>
                  </template>
                </div>
                <br>
              </div>
            </template>
          </div>
        </template>
      </div>
      <el-result icon="error" title="任务不存在!" v-if="taskError || !taskInfo?.id">
        <template #sub-title>
          <p>{{ taskError }}</p>
        </template>
        <template #extra>
          <el-button @click="toHome">回到主页</el-button>
          <el-button type="primary" @click="goBack">返回</el-button>
        </template>
      </el-result>

      <BackToTop />
      <br><br><br>
      <el-dialog v-model="isSimulate" width="600" align-center destroy-on-close>
        <Simulate :list="[...check]" :user="isSimulateUser" :taskid="taskInfo?.id" :leave="[...leaveList]" />
      </el-dialog>
    </template>
    <template v-else>
      <template v-if="taskGift">
        <el-empty :image="Gift" description="盲盒打开中..." />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/markdown.scss'
import '@/assets/styles/one-dark-pro.scss'
import Gift from '@/assets/img/gift.png'
import Simulate from '@/components/Views/Simulate.vue';
import { router, HOME_PAGE } from '@/router'
import { taskData, userData } from '@/utils/data'
import { AttendanceType, TaskInfo } from '@/types/store'
import { ElMessage, ElMessageBox } from 'element-plus'
import BackToTop from '@comps/Widgets/BackToTop.vue'
import { getTaskEnd, getTaskEndDay, getTaskType, updateTaskList } from '@/utils/task'
import { dayjs } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { PowerType, TaskType } from '@/enums/appEnum'
import { emitter } from '@/utils/event'
import { useClassStore } from '@/store/modules/class';
import { TaskRequest } from '@/api/taskApi';
import { ApiStatus } from '@/utils/http/status';
import avatar from "@/assets/img/avatar/avatar.jpg";
import { AttendanceCategory, AttendanceEnum, classifyAttendanceAsArray, getAttendanceEnum } from '@/enums/classEnum';
import { Finished, Edit, Delete, Share } from '@element-plus/icons-vue'
import { antiShake } from '@/utils/utils';
import copy from "copy-to-clipboard";
import { LeaveInfo } from '@/store/modules/leave';
import { LeaveRequest } from '@/api/leaveApi';
import { socket } from '@/utils/socket';
import { BaseResult } from '@/types/axios';
const articleId = ref('')
const routerRef = useRoute()
const taskInfo = ref<TaskInfo>()

const taskError = ref('')
const taskGift = ref(false)

const search = ref('')
const loading = ref(false)

const userInfo = computed(() => useUserStore().getUserInfo)
const classInfo = computed(() => useClassStore().getClassInfo)
const classList = computed(() => useClassStore().getClassList)

const allList = ref<string[]>([])
const trueList = ref<string[]>([])
const falseList = ref<string[]>([])
const check = ref<AttendanceType[]>([])

const classifyList = ref<AttendanceCategory[]>([])

const checkAll = ref(false)
const isIndeterminate = ref(false)

const isSimulate = ref(false);
const isSimulateUser = ref('');
const searchname = ref('')

const leaveList = ref<LeaveInfo[]>([])

socket.on("connect", () => {
  if (!userInfo.value.id || !classInfo.value.id)
    return

  // 请假报备数据监听
  socket.on("leave-add", () => {
    getLeaveList()
  })
});

watch(() => check.value, () => {
  (isSimulate.value && getEditPower.value) && antiShakeUpdateTaskList()
  classifyList.value = classifyAttendanceAsArray(check.value)
}, { deep: true })

watch(() => taskData.value.all(), () => {
  nextTick(() => {
    setViewData();
  })
}, { deep: true })

const getUserIndex = (userid: string) => {
  return classList.value.findIndex(item => item.id === userid)
}

const openSimulate = (user: string) => {
  if (getEditPower.value) {
    isSimulate.value = true;
    isSimulateUser.value = user;
  }
}

const getEditPower = computed(() => {
  if (userInfo.value.power === PowerType.ADMIN) return true;
  if (taskInfo.value?.type === TaskType.WORK && userInfo.value.id === classInfo.value.XW)
    return true;
  if (taskInfo.value?.type === TaskType.ARRIVE && userInfo.value.id === classInfo.value.JW)
    return true;
  if (taskInfo.value?.user === userInfo.value.id && !taskInfo.value?.lock)
    return true;

  return false
})

const getLeaveList = () => {
  leaveList.value = [];
  nextTick(async () => {
    let res: BaseResult<any>
    if (getEditPower.value)
      res = await LeaveRequest.class({ class: classInfo.value.id as string })
    else res = await LeaveRequest.cover({ class: classInfo.value.id as string })
    if (res.err === ApiStatus.success) {
      res.result.forEach((item: LeaveInfo) => {
        if (Number(item.start) < Number(taskInfo.value?.start) && Number(item.end) > Number(taskInfo.value?.start)) leaveList.value.push(item)
      })
    }
  })
}

const useUpdateTaskList = () => {
  updateTaskList(taskInfo.value as TaskInfo, {
    true: trueList.value,
    check: check.value
  })
}

const antiShakeUpdateTaskList = antiShake(useUpdateTaskList, 2000)
const antiShakeGetLeaveList = antiShake(getLeaveList, 1000)

const handAllChageCheck = (type: AttendanceEnum) => {
  ElMessageBox.confirm(
    `是否进行 全部${getAttendanceEnum(type).name} 操作？`,
    '操作警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    check.value.forEach(item => {
      item.notes = '';
      item.state = type;
    })
    useUpdateTaskList()
  })
}

const removeHtmlTagsButKeepNewlines = (htmlString: string): string => {
  let text = htmlString
    .replace(/<(div|p|br|h[1-6]|section|article)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<(td|th)[^>]*>/gi, ' ')
    .replace(/<tr[^>]*>/gi, '\n');
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

const copyShareLink = () => {
  const text = copy(`${taskInfo.value?.title}作业\n${removeHtmlTagsButKeepNewlines(taskInfo.value?.content as string)}\n\n${getTaskEndDay(taskInfo.value as TaskInfo)}，截止时间：${dayjs(Number(taskInfo.value?.end)).format('YYYY年MM月DD日 HH:mm')}\n详情：https://youwebsite_url/#/task/get?id=${taskInfo.value?.id}`);
  if (text)
    ElMessage.success("分享文本已复制！")
  else ElMessage.error('分享文本复制失败');
}

const isSearchD = (str: string) => {
  if (!searchname.value)
    return false

  if (str.indexOf(searchname.value) === -1)
    return true
}

const isSearchB = (str: string) => {
  if (!searchname.value)
    return false

  if (str.indexOf(searchname.value) !== -1)
    return true
}

const useLeaveInfo = computed(() => (userid: string) => {
  return leaveList.value.filter(item => item.user === userid)
})

const setBadgeValue = computed(() => (node: AttendanceType) => {
  return useLeaveInfo.value(node.id).length ? useLeaveInfo.value(node.id)[0].type === getAttendanceEnum(node.state).name ? useLeaveInfo.value(node.id)[0].type : '' : (node.notes ? '#' : '')
})

onMounted(() => {
  scrollToTop()
  articleId.value = String(routerRef.query.id)
  taskInfo.value = taskData.value.use(articleId.value)

  const giftid = sessionStorage.getItem('gift')
  if (giftid === articleId.value) {
    sessionStorage.removeItem('gift')
    taskGift.value = true
    setTimeout(() => {
      setViewData();
    }, 3000)
  } else setViewData();

  if (taskInfo.value.type == TaskType.NOTICE) {
    trueList.value.push(userInfo.value.id as string)
    useUpdateTaskList();
  }
})

const setViewData = () => {
  articleId.value = String(routerRef.query.id)
  taskInfo.value = taskData.value.use(articleId.value)

  loading.value = true

  setTaskList();
}

const setTaskList = async () => {
  if (!taskInfo.value) return
  if (taskInfo.value.list) {
    allList.value = taskInfo.value.list.all
    trueList.value = taskInfo.value.list.true
    falseList.value = taskInfo.value.list.false
    check.value = taskInfo.value.list.check
    const al = allList.value.length
    const tl = trueList.value.length
    checkAll.value = tl === al
    isIndeterminate.value = tl > 0 && tl !== al
  }
  if (taskInfo.value.type == TaskType.ARRIVE) {
    antiShakeGetLeaveList()

    classifyList.value = classifyAttendanceAsArray(check.value)
    classifyList.value.forEach((item) => {
      if (item.type === getAttendanceEnum(AttendanceEnum.WD).key) {
        (item.records.length === check.value.length && getEditPower.value) && openSimulate('');
      }
    })
  }
}

emitter.on('simulateList', (taskid: string) => {
  if (taskInfo.value?.id === taskid && isSimulate.value) {
    isSimulate.value = false
    antiShakeUpdateTaskList();
  }
})

const goBack = () => {
  router.back()
}

const toHome = () => {
  router.push(HOME_PAGE);
}

const deleteTask = () => {
  ElMessageBox.confirm(
    `是否删除该任务？高危警告：此操作不可撤回！请谨慎考虑！`,
    '删除警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    TaskRequest.delete(taskInfo.value?.id as string).then((res) => {
      if (res.err === ApiStatus.success) {
        taskData.value.dele(taskInfo.value?.id as string)
        socket.emit('task-delete', taskInfo.value?.id)
        ElMessage.success("删除成功")
      } else ElMessage.error(res.result)
    })
  })
}

const goEdit = () => {
  router.push({
    path: `/task/update`,
    query: {
      id: taskInfo.value?.id
    }
  })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleCheckAllChange = (val: any) => {
  trueList.value = val ? allList.value : []
  isIndeterminate.value = false
  antiShakeUpdateTaskList();
}

const handleCheckedCitiesChange = (value: any[]) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === allList.value.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < allList.value.length
  antiShakeUpdateTaskList();
}
</script>

<style lang="scss" scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
}

.article-detail {
  .content {
    max-width: 800px;
    margin: auto;
    margin-top: 60px;

    .title {
      width: 100%;
      display: flex;
      align-items: center;
    }

    .user {
      .avatar {
        width: 25px;
        height: 25px;
        border-radius: 6px;
      }

      >div {
        margin-left: 5px;

        .user-name {
          font-weight: 500;
        }
      }
    }

    .file {
      width: 100%;
      height: auto;

      .file-item {
        width: 100%;
        display: grid;
        text-align: center;
        grid-template-columns: 37.5px 1fr 50px;
        column-gap: 12px;
        padding: 10px 0;
        align-items: center;
        justify-items: space-between;

        .file-info {
          width: 100%;
          text-align: left;

          .filename {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            padding: 5px 0;
          }
        }
      }
    }

    .handle {
      width: 100%;
      height: auto;
    }

    .list {
      width: 100%;
      height: auto;
      text-align: center;

      .list-box {
        width: 100%;
        height: auto;
        display: grid;
        margin: 10px 0;
        grid-template-columns: 20px 1fr;
        column-gap: 10px;

        .tag {
          display: grid;
          grid-template-columns: repeat(auto-fill, 80px);
          gap: 10px;
        }
      }
    }

    .markdown-body {
      margin-top: 30px;

      img {
        width: 100%;
        border: 1px solid var(--art-gray-200);
      }

      pre {
        position: relative;

        &:hover {
          .copy-button {
            opacity: 1;
          }
        }

        &::before {
          position: absolute;
          top: 0;
          left: 50px;
          width: 1px;
          height: 100%;
          content: '';
          background: #0a0a0e;
        }
      }

      .line-number {
        box-sizing: border-box;
        display: inline-block;
        width: 50px;
        margin-right: 10px;
        font-size: 14px;
        color: #9e9e9e;
        text-align: center;
      }

      .copy-button {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1;
        width: 40px;
        height: 40px;
        font-size: 20px;
        line-height: 40px;
        color: #999;
        text-align: center;
        cursor: pointer;
        background-color: #000;
        border: none;
        border-radius: 8px;
        opacity: 0;
        transition: all 0.2s;
      }
    }
  }
}
</style>
