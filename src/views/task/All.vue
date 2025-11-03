<template>
  <div class="page-content article-list">
    <el-row justify="space-between" :gutter="10">
      <el-col :lg="6" :md="6" :sm="14" :xs="16">
        <el-input v-model.trim="searchVal" :prefix-icon="Search" clearable placeholder="输入任务名称查询"
          @keyup.enter="getArticleList({ backTop: true })" />
      </el-col>
      <el-col :lg="12" :md="12" :sm="0" :xs="0">
        <el-radio-group v-model="searchType" @change="getArticleList({ backTop: true })" :fill="searchTypeColor">
          <el-radio-button value="全部" label="全部"></el-radio-button>
          <el-radio-button :value="TaskType.WORK" label="作业"></el-radio-button>
          <el-radio-button :value="TaskType.ARRIVE" label="考勤"></el-radio-button>
          <el-radio-button :value="TaskType.NOTICE" label="通知"></el-radio-button>
        </el-radio-group>
      </el-col>
      <el-col :lg="6" :md="6" :sm="10" :xs="6" style="display: flex; justify-content: end">
        <el-button type="success" @click="toAddTask"
          v-if="(userInfo?.power || PowerType.NULL) > PowerType.ORDINARY">发布任务</el-button>
      </el-col>
    </el-row>

    <div class="list">
      <div class="offset">
        <div class="item" v-for="item in showList" :key="item.id" @click="toDetail(item)">
          <!-- 骨架屏 -->
          <el-skeleton animated :loading="isLoading" :throttle="500" :count="1" style="width: 100%; height: 100%">
            <template #template>
              <div class="top">
                <el-skeleton-item variant="image" style="width: 100%; height: 100%; border-radius: 10px" />
                <div style="padding: 16px 0">
                  <el-skeleton-item variant="p" style="width: 80%" />
                  <el-skeleton-item variant="p" style="width: 40%; margin-top: 10px" />
                </div>
              </div>
            </template>

            <template #default>
              <div class="top">
                <div class="cover" :style="`background: var(--el-color-${getTaskType(Number(item.type)).type})`">
                  <div style="width: 90%;">
                    <p class="title">{{ item.title }}</p>
                  </div>
                </div>
                <div class="end-box" v-if="item.type === TaskType.WORK">
                  <el-tag effect="plain" :type="getTaskEnd(item).type">
                    {{ getTaskEnd(item).text }}
                    &nbsp;·&nbsp;
                    {{ getTaskEndDay(item) === '已截止' ? item.uselist ? item.list.true.includes(userInfo.id as string) ?
                      '已完成' : '未完成' : '无统计' : getTaskEndDay(item) }}
                  </el-tag>
                </div>
                <div class="end-box" v-if="item.type === TaskType.ARRIVE">
                  <el-tag effect="plain" type="info">
                    第{{ item.week }}周
                  </el-tag>
                </div>
                <div class="name-box">
                  <span class="name">{{ getTaskType(item.type).text }}</span>
                </div>
              </div>
              <div class="bottom">
                <div class="info">
                  <div class="text">
                    <i class="iconfont" v-if="Number(item.type) === TaskType.WORK">&#xe61f;</i>
                    <i class="iconfont" v-else>&#xe7c1;</i>
                    <span v-if="item.type === TaskType.WORK">
                      {{ dayjs(Number(item.end)).format("YYYY年MM月DD日 HH:mm") }}
                    </span>
                    <span v-else>
                      {{ dayjs(Number(item.start)).format("YYYY年MM月DD日 HH:mm") }}
                    </span>
                    <div class="line"></div>
                    <i class="iconfont">&#xe7f2;</i>
                    <span>
                      <template v-if="item.type === TaskType.ARRIVE">
                        {{item.list.check.filter(item => item.state === AttendanceEnum.YD).length}}
                        <span>&nbsp;/&nbsp;</span>
                        {{ item.list.check.length }}人
                      </template>
                      <template v-else>
                        {{ Number(item.type) === TaskType.NOTICE ? [...new Set(item.list.true)].length :
                          item.uselist ? item.list.true.length : '--' }}
                        <span>&nbsp;/&nbsp;</span>
                        {{ item.list.all.length }}人
                      </template>
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>

    <div style="margin-top: 16vh" v-if="showEmpty">
      <el-empty :image="emptypng" :image-size="250" :description="`木的任务哟 ${EmojiText[0]}`" />
    </div>

    <div style="display: flex; justify-content: center; margin-top: 20px">
      <el-pagination size="default" background v-model:current-page="currentPage" :page-size="pageSize" :pager-count="9"
        layout="prev, pager, next, total,jumper" :total="total" :hide-on-single-page="true"
        @current-change="handleCurrentChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { router } from '@/router'
import { Search } from '@element-plus/icons-vue'
import EmojiText from '@/utils/emojo'
import { useUserStore } from '@/store/modules/user'
import { PowerType, TaskType } from '@/enums/appEnum'
import { dayjs } from 'element-plus'
import { getTaskEnd, getTaskEndDay, getTaskType } from '@/utils/task'
import { taskData } from '@/utils/data'
import { TaskInfo } from '@/types/store'
import { AttendanceEnum } from '@/enums/classEnum'
import emptypng from '@/assets/img/empty/empty.png'

const searchVal = ref('')
const searchType = ref<"全部" | TaskType>(TaskType.WORK)
const searchTypeColor = computed(() => getTaskType(searchType.value as TaskType).color)

const userInfo = useUserStore().info;

const taskList = ref<TaskInfo[]>([])
const showList = ref<TaskInfo[]>([])
const currentPage = ref(1)
const pageSize = ref(40)
const total = ref(0)
const isLoading = ref(true)

const showEmpty = computed(() => {
  return taskList.value.length === 0 && !isLoading.value
})

onMounted(() => {
  taskList.value = taskData.value.all()
  getArticleList({ backTop: false })
})

watch(() => searchVal.value, () => {
  getArticleList({ backTop: true })
})

watch(() => taskData.value.all(), () => {
  getArticleList({ backTop: true })
}, {
  deep: true
})

const getArticleList = ({ backTop = false }) => {
  isLoading.value = true

  if (searchType.value != "全部") {
    showList.value = taskList.value.filter(item => getTaskType(Number(item.type)).text === getTaskType(searchType.value as TaskType).text)
  } else showList.value = taskList.value

  if (searchVal.value) {
    searchType.value = "全部";
    showList.value = taskList.value.filter(item => item.title.indexOf(searchVal.value) !== -1)
  }

  isLoading.value = false
  if (backTop) scrollToTop()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  getArticleList({ backTop: true })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0 })
}

const toDetail = (item: TaskInfo) => {
  router.push({
    path: `/task/get`,
    query: {
      id: item.id
    }
  })
}

const toEdit = (item: TaskInfo) => {
  router.push({
    path: `/article/article-publish`,
    query: {
      id: item.id
    }
  })
}

const toAddTask = () => {
  router.push({
    path: `/task/add`
  })
}

</script>

<style lang="scss" scoped>
.article-list {
  .custom-segmented .el-segmented {
    height: 40px;
    padding: 6px;
    --el-border-radius-base: 8px;
  }

  .list {
    margin-top: 20px;

    .offset {
      width: calc(100% + 20px);
      display: flex;
      flex-wrap: wrap;

      .item {
        box-sizing: border-box;
        width: calc(20% - 20px);
        margin: 0 20px 30px 0;
        cursor: pointer;

        &:hover {
          .el-button {
            opacity: 1 !important;
          }
        }

        .top {
          position: relative;
          aspect-ratio: 16/9.5;

          .cover {
            width: 100%;
            height: 100%;
            color: #fff;
            display: flex;
            object-fit: cover;
            border-radius: 6px;
            text-align: center;
            font-family: "黑体";
            align-items: center;
            background: #f1f2f5;
            justify-content: center;

            .title {
              width: 100%;
              hyphens: auto;
              font-size: 30px;
              letter-spacing: 1px;
              white-space: pre-wrap;
              word-break: break-all;
              overflow-wrap: break-word;
            }
          }

          .end-box {
            position: absolute;
            top: 5px;
            right: 5px;
          }

          .name-box {
            position: absolute;
            bottom: 5px;
            left: 5px;

            .name {
              color: #f5f5f5;
              font-size: 14px;
              letter-spacing: 1px;
            }
          }
        }

        .bottom {
          h2 {
            margin-top: 10px;
            font-size: 18px;
            font-weight: 500;
            color: #333;
            @include ellipsis();
          }

          .info {
            display: flex;
            justify-content: space-between;
            width: 100%;
            height: 25px;
            margin-top: 6px;
            line-height: 25px;

            .text {
              display: flex;
              align-items: center;

              i {
                margin-right: 5px;
                font-size: 14px;
                color: #555;
              }

              span {
                font-size: 12px;
              }

              .line {
                width: 1px;
                height: 12px;
                margin: 0 15px;
                background-color: var(--art-border-dashed-color);
              }
            }

            .el-button {
              opacity: 0;
              transition: all 0.3s;
            }
          }
        }
      }
    }
  }
}

@media only screen and (max-width: $device-notebook) {
  .article-list {
    .list {
      .offset {
        .item {
          width: calc(25% - 20px);
        }
      }
    }
  }
}

@media only screen and (max-width: $device-ipad-pro) {
  .article-list {
    .list {
      .offset {
        .item {
          width: calc(33.333% - 20px);

          .bottom {
            h2 {
              font-size: 16px;
            }
          }
        }
      }
    }
  }
}

@media only screen and (max-width: $device-ipad) {
  .article-list {
    .list {
      .offset {
        .item {
          width: calc(50% - 20px);
        }
      }
    }
  }
}

@media only screen and (max-width: $device-phone) {
  .article-list {
    .list {
      .offset {
        .item {
          width: calc(100% - 20px);
        }
      }
    }
  }
}
</style>
