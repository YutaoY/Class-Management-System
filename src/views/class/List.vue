<template>
  <div class="page-content">
    <el-row :gutter="12" v-if="userStore.getIsAdmin">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-input placeholder="班级名称"></el-input>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8" class="el-col2">
        <el-button>搜索</el-button>
        <el-button v-if="userStore.getIsAdmin" type="primary" @click="isClassAdd = true">新增班级</el-button>
      </el-col>
    </el-row>

    <art-table :data="classGetAll">
      <template #default>
        <el-table-column prop="name" label="班级" />
        <el-table-column prop="counselor" label="辅导员" sortable />
        <el-table-column prop="tel" label="手机号" />
        <el-table-column label="作业负责人">
          <template #default="scope">
            <el-tag type="info" v-if="!scope.row.XW">未设置</el-tag>
            <div class="user" style="display: flex; align-items: center" v-else>
              <el-avatar :size="25" shape="square" :src="userData.use(scope.row.XW).avatar">
                <img :src="avatar" />
              </el-avatar>
              <div>
                <el-text class="user-name"
                  :type="userData.use(scope.row.XW).sex === UserSex.MALE ? 'primary' : 'danger'">
                  {{ userData.use(scope.row.XW).name }}
                </el-text>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="考勤负责人">
          <template #default="scope">
            <el-tag type="info" v-if="!scope.row.JW">未设置</el-tag>
            <div class="user" style="display: flex; align-items: center" v-else>
              <el-avatar :size="25" shape="square" :src="userData.use(scope.row.JW).avatar">
                <img :src="avatar" />
              </el-avatar>
              <div>
                <el-text class="user-name"
                  :type="userData.use(scope.row.JW).sex === UserSex.MALE ? 'primary' : 'danger'">
                  {{ userData.use(scope.row.JW).name }}
                </el-text>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="state" width="100px">
          <template #default="scope">
            <el-tag :type="scope.row.state === 1 ? 'primary' : 'info'">
              {{ scope.row.state === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" v-if="userInfo?.power == PowerType.ADMIN">
          <template #default="scope">
            <el-button link :icon="EditPen" type="primary" @click="handUserData(scope.row.id)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </template>
    </art-table>

    <el-dialog v-model="isClassAdd" title="新增班级" :z-index="999" width="500" align-center destroy-on-close>
      <div class="class-add-dialog-body-box">
        <AddClass />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { router } from '@/router'
import { ClassInfo } from "@/types/store"
import { ClassRequest } from "@/api/classApi"
import { useUserStore } from "@/store/modules/user";
import { EditPen } from '@element-plus/icons-vue'
import { ApiStatus } from "@/utils/http/status";
import { ElMessage } from "element-plus";
import { emitter } from "@/utils/event";
import { useSettingStore } from "@/store/modules/setting";
import AddClass from "@/views/class/Add.vue"
import avatar from "@/assets/img/avatar/avatar.jpg";
import { userData } from "@/utils/data";
import { PowerType, UserSex } from "@/enums/appEnum";

const isClassAdd = ref(false)
const userStore = useUserStore()
const settingStore = useSettingStore()
const classGetAll = ref<ClassInfo[]>([])
const userInfo = computed(() => userStore.getUserInfo)

onMounted(() => {
  getClassList();
})

const getClassList = async () => {
  if (userInfo.value.power == PowerType.ADMIN) {
    const res = await ClassRequest.getAll();
    if (res.err === ApiStatus.success) {
      const result: ClassInfo[] = res.result;
      if (userStore.getIsAdmin) result.forEach((item: ClassInfo) => {
        classGetAll.value.push(item);
      })
      else classGetAll.value.push(result.filter(item => item.id === userInfo.value.class)[0])
    } else ElMessage.error(res.result)
  } else {
    const res = await ClassRequest.get({
      classid: userInfo.value.class
    })
    if (res.err === ApiStatus.success) {
      const result: ClassInfo = res.result;
      classGetAll.value.push(result)
    } else ElMessage.error(res.result)
  }
}

const handUserData = (id: string) => {
  router.push({
    path: `/class/update`,
    query: {
      id,
      data: JSON.stringify({ ...classGetAll.value.filter((item: ClassInfo) => item.id == id)[0] })
    }
  })
}

emitter.on('updateClassList', () => {
  nextTick(() => {
    settingStore.reload();
  })
})
</script>

<style lang="scss" scoped>
.page-content {
  .svg-icon {
    width: 1.8em;
    height: 1.8em;
    overflow: hidden;
    vertical-align: -8px;
    fill: currentcolor;
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

  .class-add-dialog-body-box {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: auto;
    overflow-x: hidden;
  }
}
</style>
