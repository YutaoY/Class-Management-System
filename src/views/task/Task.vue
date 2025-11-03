<template>
  <div class="page-content">
    <el-page-header @back="goBack">
      <template #content>
        <span class="text-large font-600 mr-3">
          {{ pageMode === PageModeEnum.Edit ? '编辑' : '发布' }}任务
        </span>
      </template>
    </el-page-header>
    <div class="content">
      <div class="article-edit">
        <div>
          <div class="editor-wrap" style="margin-top: 1.44em;">
            <el-form label-width="auto">
              <el-carousel :interval="4000" type="card" height="144px" :autoplay="false" @change="switchTaskType"
                v-if="pageMode === PageModeEnum.Add" indicator-position="none">
                <el-carousel-item v-for="item in TaskOptions" :key="item.value">
                  <div class="task-type-title" :style="{ backgroundColor: `${item.color}` }">
                    <span>{{ item.label }}</span>
                  </div>
                </el-carousel-item>
              </el-carousel>
              <el-form-item label="任务类型">
                <el-text v-if="pageMode === PageModeEnum.Edit">
                  {{ getTaskType(taskType).text }}
                </el-text>
              </el-form-item>
              <el-form-item label="任务锁定"
                v-if="pageMode === PageModeEnum.Edit && taskType != TaskType.NOTICE && getEditPower">
                <el-space :size="20">
                  <el-switch v-model="taskLock" />
                  <el-text type="warning">
                    <el-icon>
                      <Warning />
                    </el-icon>
                    锁定此任务后，仅管理员与任务相关负责人才可修改此任务。
                  </el-text>
                </el-space>
              </el-form-item>
              <el-form-item label="任务负责人"
                v-if="pageMode === PageModeEnum.Edit && userInfo.power === PowerType.ADMIN && taskType === TaskType.ARRIVE">
                <el-autocomplete v-model="fzname" :fetch-suggestions="queryClass" placeholder="选择负责人"
                  @select="handleTaskUser" @clear="taskUser = ''" clearable style="max-width: 500px;">
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
              </el-form-item>
              <el-form-item v-if="pageMode === PageModeEnum.Add && (!classInfo.JW || !classInfo.XW)">
                <el-alert type="info" show-icon>
                  <template #title>
                    完善班级的相关负责人，更方便管理！
                    <el-link type="primary" v-if="userInfo.power === PowerType.ADMIN" :underline="false"
                      @click="toClassList">去配置 ></el-link>
                  </template>
                </el-alert>
              </el-form-item>
              <el-form-item label="课程关联" v-if="classInfo.KCB && classInfo.KCB[0]">
                <el-space :size="10" wrap>
                  <el-tag type="info" v-for="(item, index) in classInfo.KCB[0].list" :key="index" size="large"
                    style="cursor: pointer;" @click="clickTaskKC(item.name)">
                    {{ item.name }}
                  </el-tag>
                </el-space>
                &nbsp;
                <el-link v-if="pageMode === PageModeEnum.Add && taskType === TaskType.ARRIVE && taskTitlt && fasttag"
                  type="success" @click="submit">&nbsp;直接发布&nbsp;</el-link>
                <el-text type="warning">
                  <el-icon>
                    <Warning />
                  </el-icon>
                  选择课程标签可快速重命名任务名称，考勤任务选择课程标签后可快速发布。
                </el-text>
              </el-form-item>
              <el-form-item label="复制任务"
                v-if="taskLastTask.length > 0 && pageMode === PageModeEnum.Add && taskType === TaskType.ARRIVE">
                <el-space wrap>
                  <el-text>使用
                    <el-text type="primary">
                      {{ dayjs(Number(taskLastTask[0].start)).format('YYYY-MM-DD HH:mm') }}
                      {{ taskLastTask[0].title }}
                    </el-text>
                    的考勤数据</el-text>
                  <el-popconfirm title="确认使用复制发布？" placement="top" @confirm="copyLastARRIVETask">
                    <template #reference>
                      <el-link :underline="false" type="primary">复制发布&nbsp;></el-link>
                    </template>
                  </el-popconfirm>
                </el-space>
              </el-form-item>
              <el-form-item label="任务名称">
                <el-input v-model="taskTitlt" placeholder="请输入任务名称" maxlength="50" clearable @input="fasttag = false" />
              </el-form-item>
              <template v-if="taskType == TaskType.ARRIVE">
                <el-form-item label="考勤时间">
                  <el-date-picker v-model="createDate" type="datetime" placeholder="选择时间" />
                </el-form-item>
                <el-form-item label="考勤周数">
                  <el-input-number v-model="taskWeek" :min="1" />&nbsp;&nbsp;
                  <el-text type="warning" v-if="classInfo.KCB && classInfo.KCB[0]">
                    <el-icon>
                      <Warning />
                    </el-icon>
                    当前系统计算为第 {{ calculateWeeksPeriod }} 周。
                    <el-link v-if="taskWeek != calculateWeeksPeriod" type="success" :underline="false"
                      @click="useSystemWeek()">使用此值</el-link>
                  </el-text>
                  <el-text type="info" v-else>
                    <el-icon>
                      <Warning />
                    </el-icon>
                    配置课程表，自动计算周数！
                    <el-link type="success" :underline="false" @click="toSetKCB">去添加 ></el-link>
                  </el-text>
                </el-form-item>
              </template>
              <template v-if="taskType == TaskType.WORK">
                <el-form-item label="作业截止">
                  <el-date-picker v-model="deadlineData" type="datetime" placeholder="选择截止时间" :shortcuts="shortcuts" />
                </el-form-item>
                <el-form-item label="启用列表">
                  <el-switch v-model="taskUseList" />
                  &nbsp;
                  <el-text type="info">
                    <el-icon>
                      <Warning />
                    </el-icon>
                    是否需要名单列表辅助统计
                  </el-text>
                </el-form-item>
              </template>
              <el-form-item label="启用内容" v-if="taskType === TaskType.ARRIVE">
                <el-switch v-model="isShowContent" />
              </el-form-item>
              <el-form-item v-if="isShowContent">
                <editor class="el-top" v-if="loading" v-model="taskContent" style="height: 50vh" />
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" class="el-top" @click="submit">
                  {{ pageMode === PageModeEnum.Edit ? '保存' : '发布' }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ApiStatus } from '@/utils/http/status'
import { dayjs, ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import EmojiText from '@/utils/emojo'
import { PageModeEnum } from '@/enums/formEnum'
import { TaskOptions } from '@/utils/options'
import { PowerType, TaskType, UserSex } from '@/enums/appEnum'
import { TaskRequest } from '@/api/taskApi'
import { taskData, userData } from '@/utils/data'
import { useClassStore } from '@/store/modules/class'
import { AttendanceType, TaskInfo, UserInfo } from '@/types/store'
import { AttendanceEnum } from '@/enums/classEnum'
import { getTaskType } from '@/utils/task'
import { TaskDefualt } from '@/api/model/taskParams'
import { socket } from '@/utils/socket'
import { getAvatar } from '@/utils/avatar'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const taskID = ref<string>('');
const loading = ref(false)
const fasttag = ref(false)

const userInfo = computed(() => useUserStore().getUserInfo)
const classInfo = computed(() => useClassStore().getClassInfo)

const pageMode = ref<PageModeEnum>(PageModeEnum.Add)// 页面类型 新增 ｜ 编辑
// 获取文章详情内容
const taskUser = ref('') // 发布者
const taskTitlt = ref('') // 文章标题
const taskLock = ref(false)
const taskUseList = ref(true)
const taskWeek = ref(1)
const taskType = ref<TaskType>(TaskType.ARRIVE) // 文章类型
const taskContent = ref('') // 编辑器内容
const createDate = ref(new Date()) // 创建时间
const deadlineData = ref() // 截止时间
const files = ref<string[]>([]) // 附件

const isShowContent = ref(false)
const taskLastTask = computed(() =>
  taskData.value.all().filter(item => item.type === TaskType.ARRIVE)
)

const resetForm = () => {
  if (pageMode.value === PageModeEnum.Add) {
    taskTitlt.value = ''
    taskContent.value = ''
    createDate.value = new Date()
    deadlineData.value = null
    files.value = []
  }
}

const clickTaskKC = (value: string) => {
  fasttag.value = true
  taskTitlt.value = value
}

const fzname = computed(() => {
  return taskUser.value ? userData.value.use(taskUser.value).name : ''
})

const queryClass = (queryString: string, cb: (arg: any) => void) => {
  const results = queryString
    ? useClassStore().getClassList.filter(createFilter(queryString))
    : useClassStore().getClassList
  cb(results)
}

const createFilter = (queryString: string) => {
  return (restaurant: UserInfo) => {
    return (
      restaurant.name.toLowerCase().indexOf(queryString.toLowerCase()) !== -1
    )
  }
}

const handleTaskUser = (item: Record<string, any>) => {
  taskUser.value = item.id;
}

const calculateWeeksPeriod = computed((): number => {
  if (!classInfo.value.KCB?.length) return 1;
  const startDate = new Date(classInfo.value.KCB[0].first);
  const endDate = createDate.value;
  const startMonday = new Date(startDate);
  const startDay = startDate.getDay();
  const adjustToMonday = startDay === 0 ? -6 : 1 - startDay;
  startMonday.setDate(startDate.getDate() + adjustToMonday);
  const endMonday = new Date(endDate);
  const endDay = endDate.getDay();
  const adjustEndToMonday = endDay === 0 ? -6 : 1 - endDay;
  endMonday.setDate(endDate.getDate() + adjustEndToMonday);
  startMonday.setHours(0, 0, 0, 0);
  endMonday.setHours(0, 0, 0, 0);
  const diffTime = endMonday.getTime() - startMonday.getTime();
  const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);
  return Math.floor(diffWeeks) + 1;
});

const useSystemWeek = () => {
  if (pageMode.value === PageModeEnum.Add)
    taskWeek.value = calculateWeeksPeriod.value
}

watch(() => createDate.value, () => useSystemWeek())


onMounted(() => {
  scrollToTop()
  initPageMode()
  isShowContent.value = taskType.value !== TaskType.ARRIVE
})

// 初始化页面类型 新增 ｜ 编辑
const initPageMode = () => {
  const { id } = route.query
  pageMode.value = id ? PageModeEnum.Edit : PageModeEnum.Add
  if (pageMode.value === PageModeEnum.Edit && id) {
    initEditArticle()
  } else initAddArticle()
  nextTick(() => {
    loading.value = true
  })
}

// 初始化编辑文章的逻辑
const initEditArticle = () => {
  taskID.value = route.query.id as string
  const taskItem = taskData.value.use(taskID.value)
  if (!taskItem.id) {
    ElMessage.error('任务获取失败！')
    return goBack();
  }
  getArticleDetail(taskItem)
}

// 初始化新增文章逻辑
const initAddArticle = () => {
  setTaskLock()
  createDate.value = new Date()
  taskWeek.value = calculateWeeksPeriod.value
  taskUser.value = userInfo.value.id as string
}

const getEditPower = computed(() => {
  if (userInfo.value.power === PowerType.ADMIN) return true;
  if (taskType.value === TaskType.WORK && userInfo.value.id === classInfo.value.XW)
    return true;
  if (taskType.value === TaskType.ARRIVE && userInfo.value.id === classInfo.value.JW)
    return true;

  return false
})

const setTaskLock = () => {
  if (taskType.value == TaskType.WORK)
    taskLock.value = classInfo.value.XW == userStore.info.id;
  if (taskType.value == TaskType.ARRIVE)
    taskLock.value = classInfo.value.JW == userStore.info.id;
  if (userInfo.value.power === PowerType.ADMIN)
    taskLock.value = true;
}

const switchTaskType = (type: number) => {
  taskType.value = type + 1;
  isShowContent.value = taskType.value !== TaskType.ARRIVE
  setTaskLock()
}

const getArticleDetail = async (taskItem: TaskInfo) => {
  taskUser.value = taskItem.user
  taskTitlt.value = taskItem.title
  taskType.value = taskItem.type
  taskContent.value = taskItem.content || ''
  createDate.value = new Date(Number(taskItem.start))
  deadlineData.value = taskItem.end ? new Date(Number(taskItem.end)) : undefined
  taskWeek.value = taskItem.week
  taskLock.value = Boolean(taskItem.lock)
  taskUseList.value = Boolean(taskItem.uselist)
}

// 提交
const submit = () => {
  if (pageMode.value === PageModeEnum.Edit) {
    editArticle()
  } else {
    addArticle()
  }
}

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const date = new Date();
      date.setHours(23, 59, 59)
      return date
    },
  },
  {
    text: '一周',
    value: () => {
      const date = new Date()
      date.setTime(Date.now() + 3600 * 1000 * 24 * 7)
      date.setHours(23, 59, 59)
      return date
    }
  },
  {
    text: '一月',
    value: () => {
      const date = new Date()
      date.setTime(Date.now() + 3600 * 1000 * 24 * 30)
      date.setHours(23, 59, 59)
      return date
    }
  }
]

// 验证输入
const validateArticle = () => {
  if (!taskTitlt.value && taskType.value != TaskType.ARRIVE) {
    ElMessage.error(`请输入任务标题`)
    return false
  }

  if (taskContent.value === '<p><br></p>' && taskType.value != TaskType.ARRIVE) {
    ElMessage.error(`请输入任务内容`)
    return false
  }

  if (taskType.value == TaskType.WORK && !deadlineData.value) {
    ElMessage.error(`作业任务必须设置截止日期`)
    return false
  }

  if (deadlineData.value && pageMode.value === PageModeEnum.Add)
    if ((deadlineData.value as Date).getTime() < Date.now()) {
      ElMessage.error(`请选择大于当前时间的截止时间`)
      return false
    }

  return true
}

const copyLastARRIVETask = async () => {
  if (!taskLastTask.value.length) return
  try {
    const params = {
      id: userStore.info.id,
      token: userStore.info.token,
      title: taskTitlt.value || taskLastTask.value[0].title + '（复制）',
      content: taskLastTask.value[0].content,
      week: taskWeek.value,
      lock: taskLock.value ? 1 : 0,
      uselist: 0,
      files: taskLastTask.value[0].file,
      type: TaskType.ARRIVE,
      start: createDate.value ? (createDate.value as Date).getTime().toString() : Date.now().toString(),
      end: undefined,
      list: JSON.stringify(taskLastTask.value[0].list),
      class: userStore.info.class
    }
    addArticle(params);
  } catch (err) {
    console.error(err)
    ElMessage.error("复制过程中出错啦！:)")
  }
}

const buildAccountList = (): { all: string[], true: string[], false: string[], check: AttendanceType[] } => {
  let classAllName: string[] = [];
  let AttendanceList: AttendanceType[] = []
  useClassStore().getClassList.forEach(item => {
    if (item.power !== PowerType.COUNSELOR) {
      classAllName.push(item.id)
      AttendanceList.push({
        id: item.id,
        state: AttendanceEnum.KK,
        notes: ''
      })
    }
  })

  return {
    true: [],
    all: classAllName,
    check: taskType.value === TaskType.ARRIVE ? AttendanceList : [],
    false: taskType.value === TaskType.WORK ? classAllName : []
  }
}

// 构建参数
const buildParams = async () => {
  const list = buildAccountList()
  return {
    id: userStore.info.id,
    token: userStore.info.token,
    title: taskTitlt.value || `${dayjs(Date.now()).format('MM-DD HH:mm')}`,
    content: taskContent.value,
    week: taskWeek.value,
    lock: taskLock.value ? 1 : 0,
    uselist: taskUseList.value ? 1 : 0,
    files: JSON.stringify(files.value),
    type: taskType.value,
    start: createDate.value ? (createDate.value as Date).getTime().toString() : Date.now().toString(),
    end: deadlineData.value ? (deadlineData.value as Date).getTime().toString() : undefined,
    list: JSON.stringify(list),
    class: userStore.info.class
  }
}

// 新增任务
const addArticle = async (info?: TaskDefualt) => {
  try {
    if (!info) {
      if (!validateArticle()) return
      taskContent.value = delCodeTrim(taskContent.value)
    }
    const params = info ? info : await buildParams()
    const res = await TaskRequest.add(params);
    if (res.err === ApiStatus.success) {
      resetForm()
      ElMessage.success(`发布成功 ${EmojiText[200]}`)
      const taskGet = await taskData.value.get(res.result, classInfo.value.id || '')
      if (taskGet) {
        const taskdata = taskData.value.use(res.result)
        socket.emit("task-add", taskdata)
        router.push({
          path: `/task/get`,
          query: { id: res.result }
        })
      }
    }
    else ElMessage.error(res.result)
  } catch (err) {
    console.error(err)
    ElMessage.error("处理发生错误！")
  }
}

// 编辑任务
const editArticle = async () => {
  try {
    if (!validateArticle()) return
    taskContent.value = delCodeTrim(taskContent.value)
    const params = {
      taskid: taskID.value,
      user: taskUser.value,
      title: taskTitlt.value,
      content: taskContent.value,
      week: taskWeek.value,
      lock: taskLock.value ? 1 : 0,
      uselist: taskUseList.value ? 1 : 0,
      files: JSON.stringify(files.value),
      end: deadlineData.value ? (deadlineData.value as Date).getTime().toString() : undefined,
      start: (createDate.value as Date).getTime().toString()
    }
    const res = await TaskRequest.update(params);
    if (res.err === ApiStatus.success) {
      const taskdata = {
        ...taskData.value.use(taskID.value),
        ...params
      }
      ElMessage.success(`保存成功 ${EmojiText[200]}`)
      socket.emit("task-update", taskdata)
      taskData.value.update(taskdata)
    } else ElMessage.error(res.result)
  } catch (err) {
    console.error(err)
    ElMessage.error("处理发生错误！")
  }
}

const delCodeTrim = (content: string): string => {
  return content.replace(/(\s*)<\/code>/g, '</code>')
}

// 返回上一页
const goBack = () => {
  setTimeout(() => {
    router.go(-1)
  }, 800)
}

const toSetKCB = () => {
  router.push({
    path: `/class/kcb`
  })
}

const toClassList = () => {
  router.push({
    path: `/class/list`
  })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0 })
}
</script>

<style lang="scss" scoped>
.page-content {
  width: 100%;
  height: auto;

  .content {
    width: 100%;
    display: flex;
    justify-content: center;

    .article-edit {
      display: flex;
      justify-content: space-between;
      width: auto;
      max-width: 1000px;

      .el-carousel__item {
        border-radius: 30px;
        overflow: hidden;
      }

      // .el-carousel__item:nth-child(1) {
      //   border-radius: 10px;
      // }

      .editor-wrap {
        max-width: 1440px;

        .task-type-title {
          width: 100%;
          height: 100%;
          color: white;
          font-size: 3em;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: '楷体';
          text-align: center;

          span {
            text-shadow: 0px 5px 5px #999;
          }
        }

        .el-top {
          margin-top: 10px;
        }
      }

      .outline-wrap {
        box-sizing: border-box;
        width: 280px;
        padding: 20px;
        border: 1px solid #e3e3e3;
        border-radius: 8px;

        .item {
          p {
            height: 30px;
            font-size: 13px;
            line-height: 30px;
            cursor: pointer;
          }

          .level3 {
            padding-left: 10px;
          }
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
</style>
