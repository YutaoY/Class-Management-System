<template>
  <div class="region todo-list console-box">
    <div class="card-header">
      <div class="title">
        <h4>通知</h4>
      </div>
    </div>

    <div class="list" v-if="taskList.length > 0">
      <div v-for="item in taskList" :key="item.id" class="item" @click="toDetail(item)">
        <el-link class="title" truncated>{{ item.title }}</el-link>
        <el-text size="small" :type="getIsTrue(item) ? 'info' : ''">
          {{ getIsTrue(item) ? '已读' : '未读' }}
        </el-text>
      </div>
    </div>
    <el-empty :image="emptypng" :image-size="250" description="暂无通知" v-else />
  </div>
</template>

<script setup lang="ts">
import { TaskType } from '@/enums/appEnum';
import { router } from '@/router';
import { useTaskStore } from '@/store/modules/task';
import { useUserStore } from '@/store/modules/user';
import { TaskInfo } from '@/types/store';
import emptypng from '@/assets/img/empty/empty.png'
import { taskData } from '@/utils/data';

const userStore = useUserStore()
const taskList = ref<TaskInfo[]>([])

watch(() => taskData.value.all(), () => {
  showTaskList();
}, {
  deep: true
})

onMounted(() => {
  showTaskList();
})

const showTaskList = () => {
  taskList.value = taskData.value.all().filter(item => Number(item.type) === TaskType.NOTICE).slice(0, 10);
}

const getIsTrue = (item: TaskInfo) => {
  return item.list.true.includes(userStore.info.id as string)
}

const toDetail = (item: TaskInfo) => {
  router.push({
    path: `/task/get`,
    query: {
      id: item.id
    }
  })
}
</script>

<style lang="scss" scoped>
.todo-list {
  height: 444px;
  box-sizing: border-box;
  flex: 1;
  padding: 0 25px;
  margin-left: var(--console-margin);

  .list {
    height: calc(100% - 75px);
    overflow: auto;

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      padding: 10px 0;
      border-bottom: 1px solid var(--art-border-color);

      .title {
        max-width: 88%;
      }
    }
  }
}
</style>
