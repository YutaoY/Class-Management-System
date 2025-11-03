<template>
  <div class="region new-user console-box">
    <div class="card-header">
      <div class="title">
        <h4>班级作业</h4>
        <p>待完成<span>+{{ getTaskValid }}</span>
          <el-link @click="toAllTask">查看全部任务</el-link>
        </p>
      </div>
      <el-radio-group v-model="taskType" @change="setTaskList">
        <el-radio-button value="全部" label="全部"></el-radio-button>
        <el-radio-button value="即将截止" label="即将截止"></el-radio-button>
        <el-radio-button value="进行中" label="进行中"></el-radio-button>
        <el-radio-button value="已截止" label="已截止"></el-radio-button>
      </el-radio-group>
    </div>
    <div class="task-list" v-if="showList.length > 0">
      <div class="task-box">
        <el-table :data="showList" @row-click="clickRow">
          <el-table-column label="发布人" prop="avatar" #default="scope" width="200px">
            <div class="user" style="display: flex; align-items: center">
              <el-avatar :size="40" shape="square" :src="userData.use(scope.row.user).avatar">
                <img :src="avatar" />
              </el-avatar>
              <div>
                <el-text class="user-name" type="info" v-if="userInfo.id !== scope.row.user">
                  {{ userData.use(scope.row.user).name }}
                </el-text>
                <el-text class="user-name" v-else>
                  {{ userData.use(scope.row.user).name }}
                </el-text>
              </div>
            </div>
          </el-table-column>
          <el-table-column label="名称" #default="scope" width="500px">
            <el-button link :type="getTaskEnd(scope.row).text === '已截止' ? 'info' : 'primary'">
              {{ scope.row.title }}
            </el-button>
          </el-table-column>
          <el-table-column label="完成" #default="scope" width="150px">
            <template v-if="scope.row.uselist">
              <template v-if="scope.row.user === userStore.info.id">
                <el-text :type="scope.row.list.true.length == scope.row.list.all.length ? 'success' : ''">
                  {{ scope.row.list.true.length }}
                </el-text>
                <el-text>
                  /
                </el-text>
                <el-text type="success">
                  {{ scope.row.list.all.length }}
                </el-text>
              </template>
              <template v-else>
                <el-icon :color="getIsTrue(scope.row) ? ' #67C23A' : '#F56C6C'">
                  <Select v-if="getIsTrue(scope.row)" />
                  <CloseBold v-else />
                </el-icon>
              </template>
            </template>
            <el-tooltip effect="dark" content="此作业未开启统计辅助" placement="top" v-else>
              <el-link :underline="false" type="primary" @click.stop>
                <el-icon :size="25">
                  <Warning />
                </el-icon>
              </el-link>
            </el-tooltip>
          </el-table-column>
          <el-table-column label="状态" #default="scope" width="150px">
            <el-text :type="getTaskEnd(scope.row).type" v-if="getTaskEnd(scope.row).text !== '已截止'">
              {{ getTaskEndDay(scope.row) }}
            </el-text>
            <el-text type="info" v-else>已截止</el-text>
          </el-table-column>
          <el-table-column label="截止时间" #default="scope">
            {{ dayjs(Number(scope.row.end)).format('YYYY年MM月DD日 HH:mm') }}
          </el-table-column>
        </el-table>
        <br>
      </div>
    </div>
    <el-empty description="暂无作业" v-else />
  </div>
</template>

<script setup lang="ts">
import { TaskInfo } from '@/types/store';
import { taskData, userData } from '@/utils/data';
import { getTaskEnd, getTaskEndDay } from '@/utils/task';
import { dayjs, ElNotification } from 'element-plus';
import { router } from '@/router'
import avatar from "@/assets/img/avatar/avatar.jpg";
import { useUserStore } from '@/store/modules/user';
import { TaskType } from '@/enums/appEnum';

const userStore = useUserStore()

const userInfo = computed(() => userStore.info)

const taskType = ref('全部')
const taskList = ref<TaskInfo[]>([])
const showList = ref<TaskInfo[]>([])

onMounted(() => {
  setWorkData()
})

watch(() => taskData.value.all(), () => {
  setWorkData()
}, {
  deep: true
})

const setWorkData = () => {
  taskList.value = taskData.value.all().filter(item => Number(item.type) === TaskType.WORK && (new Date().getTime() - Number(item.end)) < (1000 * 60 * 60 * 24 * 3))
  setTaskList(taskType.value);

  const warnningWaork = taskList.value.filter(item => getTaskEnd(item).text === "即将截止" && !getIsTrue(item) && item.uselist)
  warnningWaork.forEach(item => {
    if (!sessionStorage.getItem(`${item.id}`)) {
      sessionStorage.setItem(`${item.id}`, Date.now().toString());
      const elNotification = ElNotification({
        title: `${item.title}作业截止提醒`,
        message: `${getTaskEndDay(item)}截止，请尽快完成哦~`,
        type: 'warning',
        duration: 0,
        onClick: () => {
          elNotification.close();
          router.push({
            path: `/task/get`,
            query: {
              id: item.id
            }
          })
        }
      })
    }
  })
}

const toDetail = (item: TaskInfo) => {
  router.push({
    path: `/task/get`,
    query: {
      id: item.id
    }
  })
}

const toAllTask = () => {
  router.push({
    path: `/task/all`
  })
}

const clickRow = (row: any, column: any, event: Event) => {
  toDetail(row);
}

const setTaskList = (val: any) => {
  if (val === "全部") {
    showList.value = [];
    taskList.value.filter(item => getTaskEnd(item).text === "即将截止").forEach(item => showList.value.push(item))
    taskList.value.filter(item => getTaskEnd(item).text === "进行中").forEach(item => showList.value.push(item))
    taskList.value.filter(item => getTaskEnd(item).text === "已截止").forEach(item => showList.value.push(item))
    return
  }
  if (val === val) showList.value = taskList.value.filter(item => getTaskEnd(item).text === val)
}

const getIsTrue = (item: TaskInfo) => {
  return item.list.true.includes(userStore.info.id as string)
}

const getTaskValid = computed(() => {
  const validList = taskList.value.filter(item => getTaskEnd(item).text !== "已截止")
  const trueList = validList.filter(item => item.list.true.includes(userStore.info.id as string) || !item.uselist);
  return validList.length - trueList.length;
})
</script>

<style lang="scss" scoped>
.region {
  width: 100%;
  max-height: 50vh;

  .any-table {
    box-shadow: none;
  }

  .card-header {
    padding-left: 25px !important;
    padding-right: 25px !important;

    .title {
      width: auto;

      p {
        span {
          color: red !important;
        }
      }
    }
  }

  .task-list {
    width: 100%;
    height: 100%;
    overflow: auto;
    display: flex;
    justify-content: center;

    .task-box {
      width: 95%;
      height: auto;

      .user {
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 6px;
        }

        >div {
          margin-left: 10px;

          .user-name {
            font-weight: 500;
          }
        }
      }
    }
  }
}
</style>
