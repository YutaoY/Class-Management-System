<template>
  <template v-if="taskInfo?.type === TaskType.WORK">
    <br>
    <template v-if="taskInfo?.uselist">
      <el-divider>
        <el-text type="success">
          已完成：{{ taskInfo?.list.true.length }}
        </el-text>&nbsp;&nbsp;
        <el-text type="danger">
          未完成：{{ (taskInfo?.list.all.length || 0) - (taskInfo?.list.true.length || 0) }}
        </el-text>
      </el-divider>

      <div class="handle" v-if="getEditPower">
        <div style="width: 100%;margin-bottom: 2em;display: flex;align-items: center;justify-content: space-between;">
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
</template>

<script setup lang="ts">
import '@/assets/styles/markdown.scss'
import '@/assets/styles/one-dark-pro.scss'
import { taskData, userData } from '@/utils/data'
import { AttendanceType, TaskInfo } from '@/types/store'
import { updateTaskList } from '@/utils/task'
import { useUserStore } from '@/store/modules/user'
import { PowerType, TaskType } from '@/enums/appEnum'
import { useClassStore } from '@/store/modules/class';
import { antiShake } from '@/utils/utils';
const articleId = ref('')
const routerRef = useRoute()
const taskInfo = ref<TaskInfo>()

const userInfo = computed(() => useUserStore().getUserInfo)
const classInfo = computed(() => useClassStore().getClassInfo)

const allList = ref<string[]>([])
const trueList = ref<string[]>([])
const falseList = ref<string[]>([])
const check = ref<AttendanceType[]>([])

const checkAll = ref(false)
const isIndeterminate = ref(false)

const searchname = ref('')

watch(() => taskData.value.all(), () => {
  nextTick(() => {
    setViewData();
  })
}, { deep: true })

const getEditPower = computed(() => {
  if (userInfo.value.power === PowerType.ADMIN) return true;
  if (taskInfo.value?.type === TaskType.WORK && userInfo.value.id === classInfo.value.XW)
    return true;
  if (taskInfo.value?.type === TaskType.ARRIVE && userInfo.value.id === classInfo.value.JW)
    return true;
  if (taskInfo.value?.user === userInfo.value.id && !taskInfo.value?.lock)
    return true;

  return false;
})

const useUpdateTaskList = () => {
  updateTaskList(taskInfo.value as TaskInfo, {
    true: trueList.value,
    check: check.value
  })
}

const antiShakeUpdateTaskList = antiShake(useUpdateTaskList, 2000)

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

onMounted(() => {
  articleId.value = String(routerRef.query.id)
  taskInfo.value = taskData.value.use(articleId.value)

  const giftid = sessionStorage.getItem('gift')
  if (giftid === articleId.value) {
    sessionStorage.removeItem('gift')
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
</style>
