<template>
  <div class="page-content">
    <table-bar :showTop="false" @search="search" @reset="resetForm(searchFormRef)" @changeColumn="changeColumn"
      :columns="columns">
      <template #top>
        <el-form :model="searchForm" ref="searchFormRef" label-width="82px">
          <el-row :gutter="20">
            <form-input label="姓名" prop="name" v-model.trim="searchForm.name" />
          </el-row>
        </el-form>
      </template>
      <template #bottom v-if="(userInfo?.power || PowerType.NULL) > PowerType.COMMITTEE">
        <el-space wrap>
          <el-button type="primary" @click="isUserAdd = true">新增成员</el-button>
          <el-select v-model="classID" style="width: 240px" @focus="getClassList" @change="checkClass"
            :loading="isGetClass" v-if="userStore.getIsAdmin">
            <el-option v-for="item in classGetAll" :label="item.name" :value="item.id" />
          </el-select>
          <el-link type="warning" v-if="userStore.getIsAdmin && classID !== '系统管理员'"
            @click="settingStore.reload()">显示系统管理员列表</el-link>
          <el-text type="info" v-if="classInfo.KCB && classInfo.KCB[0] && !userStore.getIsAdmin">
            请假、违纪次数仅统计本学期
          </el-text>
          <el-text type="info" v-if="!userStore.getIsAdmin">统计数据已排除晚自习</el-text>
        </el-space>
      </template>
    </table-bar>
    <el-table :data="showUserList.list" :row-key="showUserList.id"
      :default-sort="{ prop: 'power', order: 'descending' }">
      <el-table-column label="姓名" prop="avatar" #default="scope" v-if="columns[0].show" width="300px">
        <div class="user" style="display: flex; align-items: center">
          <el-badge :is-dot="online.includes(scope.row.id)" color="green" :offset="[-7.5, 7.5]">
            <el-avatar :size="40" shape="square" :src="scope.row.avatar" @click="lookUserAvatarURL(scope.row.id)"
              style="cursor: pointer;">
              <img :src="avatar">
            </el-avatar>
          </el-badge>
          <div>
            <el-text class="user-name" :type="scope.row.sex === UserSex.MALE ? 'primary' : 'danger'">
              {{ scope.row.name }}
            </el-text>&nbsp;
            <el-tag v-show="userInfo.id === scope.row.id" type="success" size="small" round>我</el-tag>
          </div>
        </div>
      </el-table-column>
      <el-table-column label="性别" prop="sex" #default="scope" sortable v-if="columns[1].show">
        {{sexOptions.find(item => item.value === scope.row.sex)?.label}}
      </el-table-column>
      <el-table-column label="请假" prop="QJ" sortable v-if="columns[4].show && !userStore.getIsAdmin">
      </el-table-column>
      <el-table-column label="违纪" prop="WJ" #default="scope" sortable v-if="columns[5].show && !userStore.getIsAdmin">
        <el-text :type="getAttendanceWJ(scope.row.id) > 0 ? 'danger' : ''">
          {{ getAttendanceWJ(scope.row.id) }}
        </el-text>
      </el-table-column>
      <el-table-column label="职位" prop="power" :filters="powerOptions" :filter-method="filterPower"
        filter-placement="bottom-end" v-if="columns[2].show" sortable width="200px">
        <template #default="scope">
          <el-tag :type="getTagType(scope.row.power)">
            {{ scope.row.position ? scope.row.position : buildTagText(scope.row.power)
            }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后访问时间" prop="lasttime" v-if="userInfo.power === PowerType.ADMIN">
      </el-table-column>
      <el-table-column label="状态" prop="state" sortable v-if="columns[3].show">
        <template #default="scope">
          <el-text :type="scope.row.state === 1 ? 'success' : 'danger'">
            {{ scope.row.state === 1 ? '正常' : '异常' }}</el-text>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" v-if="userInfo?.power === PowerType.ADMIN">
        <template #default="scope">
          <el-button link :icon="EditPen" type="primary" @click="handUserData(scope.row.id)">
            编辑
          </el-button>
          <el-button link :icon="Delete" type="danger" @click="deleUserData(scope.row.id)"
            v-if="!(scope.row.id === userInfo.id && userStore.getIsAdmin)">
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="isUserAdd" title="新增成员" :z-index="999" width="500" align-center destroy-on-close>
      <div class="user-add-dialog-body-box">
        <AddUser />
      </div>
    </el-dialog>

    <el-dialog v-model="isLookuUser" :title="`${userData.use(lookUserAvatar).name}的头像`" width="500" align-center center
      destroy-on-close>
      <div style="width: 100%;display: flex;justify-content: center;">
        <el-avatar :size="300" shape="square" :src="userData.use(lookUserAvatar).avatar">
          <img :src="avatar">
        </el-avatar>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { EditPen, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { router } from '@/router'
import { ClassRequest } from '@/api/classApi'
import { ApiStatus } from '@/utils/http/status'
import { ClassInfo, UserInfo } from '@/types/store'
import { UserRequest } from '@/api/usersApi'
import { PowerType, TaskType, UserSex } from '@/enums/appEnum'
import { useUserStore } from '@/store/modules/user'
import avatar from "@/assets/img/avatar/avatar.jpg";
import { Md5 } from 'ts-md5'
import { emitter } from '@/utils/event'
import { sexOptions } from '@/utils/options'
import AddUser from "@/views/user/Add.vue"
import { showLoading } from '@/utils/loading'
import { taskData, userData } from '@/utils/data'
import { AttendanceEnum } from '@/enums/classEnum'
import { useClassStore } from '@/store/modules/class'
import { useSettingStore } from '@/store/modules/setting'
import { online } from '@/utils/socket'

interface UserMoreInfo extends UserInfo {
  QJ: number;
  WJ: number;
}

const isUserAdd = ref(false);
const isGetClass = ref(true);
const classID = ref<string>('');
const userGetAll = ref<UserInfo[]>([]);
const classGetAll = ref<ClassInfo[]>([]);
const searchFormRef = ref<FormInstance>()
const userStore = useUserStore()
const isLookuUser = ref(false)
const lookUserAvatar = ref('')
const userInfo = userStore.getUserInfo;
const settingStore = useSettingStore()
const classInfo = computed(() => useClassStore().getClassInfo)
const checkDay = ref<[Date, Date]>([new Date(0, 0, 0), new Date()])
const showUserList = reactive<{
  id: string
  list: UserMoreInfo[]
}>({
  id: '',
  list: []
})
const searchForm = reactive<{
  name: string
  tel: string
}>({
  name: '',
  tel: ''
})

watch(() => userData.value.all(), () => {
  if (userInfo?.class) getUserList(userInfo.class);
}, {
  deep: true
})

onMounted(async () => {
  if (userInfo?.class) getUserList(userInfo.class);

  if (classInfo.value.KCB?.length) {
    const end = new Date()
    const firstItem = classInfo.value.KCB[0]
    const start = new Date(firstItem.first as string)
    start.setHours(0, 0, 0)

    checkDay.value = [new Date(start), new Date(end)]
  }
})

const lookUserAvatarURL = (url: string) => {
  lookUserAvatar.value = url;
  isLookuUser.value = true;
}

const powerOptions = [
  { value: '0', text: '学生' },
  { value: '1', text: '班委' },
  // { value: '2', text: '教师' },
  { value: '3', text: '管理员' }
]

const columns = reactive([
  { name: '姓名', show: true },
  { name: '性别', show: true },
  { name: '权限', show: true },
  { name: '状态', show: true },
  { name: '请假', show: true },
  { name: '违纪', show: true },
])
const getClassList = async () => {
  if (userInfo.power && userInfo.power > PowerType.COMMITTEE) {
    if (classGetAll.value.length === 0) {
      const res = await ClassRequest.getAll();
      isGetClass.value = false;
      if (res.err === ApiStatus.success) {
        classGetAll.value = res.result;
      } else ElMessage.error(res.result);
    }
  }
}

const getUserList = async (classid: string) => {
  const loading = showLoading();
  const res = await UserRequest.getAll(classid);
  if (res.err === ApiStatus.success) {
    classID.value = classid == 'Administrator' ? '系统管理员' : classid;
    userGetAll.value = res.result;
    handShowList(res.result);
  } else ElMessage.error(res.result);
  loading.closeLoading();
}

const handShowList = (list: UserInfo[]) => {
  if (showUserList.list.length !== 0)
    showUserList.list = [];
  showUserList.id = new Md5().appendAsciiStr(JSON.stringify(list)).end() as string;
  list.forEach((item: UserInfo) => {
    showUserList.list.push({
      ...item,
      QJ: getAttendanceQJ(item.id),
      WJ: getAttendanceWJ(item.id),
    });
  })
}
const checkClass = async () => {
  if (classID.value !== '')
    getUserList(classID.value);
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  console.log(formEl);
  formEl.resetFields();
  handShowList(userGetAll.value);
}

watch(searchForm, () => {
  search();
})

const search = () => {
  let searchList: UserInfo[] = [];
  userGetAll.value.forEach((item: UserInfo) => {
    if (item.name.indexOf(searchForm.name) !== -1)
      searchList.push(item);
  })
  handShowList(searchList);
}

const changeColumn = (list: any) => {
  columns.values = list;
}

const filterPower = (value: string, row: any) => {
  return row.power == value;
}

const handUserData = (id: string) => {
  router.push({
    path: `/user/update`,
    query: {
      id,
      data: JSON.stringify({ ...userGetAll.value.filter((item: UserInfo) => item.id == id)[0], class: classID.value })
    }
  })
}

const deleUserData = (id: string) => {
  ElMessageBox.confirm(
    `是否将${userData.value.use(id).name}移除本班级？`,
    '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const res = await UserRequest.delete(id);
    if (res.err === ApiStatus.success) {
      ElMessage.success("移除成功");
      location.reload();
    } else ElMessage.error(res.result);
  })
}

const getTagType = (value: number) => {
  switch (value) {
    case 0: return 'info'
    case 1: return 'warning';
    case 2: return 'primary';
    case 3: return 'danger';
    default: return 'info';
  }
}

const buildTagText = (value: PowerType) => {
  let text = '游客';
  if (value === PowerType.ORDINARY) text = '学生';
  if (value === PowerType.COMMITTEE) text = '班委';
  if (value === PowerType.COUNSELOR) text = '导员';
  if (value === PowerType.ADMIN) text = '管理员';
  return text;
}

const getStatisticsSimulateCount = computed(() => (key: AttendanceEnum, userid: string) => {
  return taskData.value.all()
    .filter(item =>
      item.title != '晚自习' &&
      item.type == TaskType.ARRIVE &&
      Number(item.start) >= checkDay.value[0].getTime() &&
      Number(item.start) <= checkDay.value[1].getTime() &&
      item.list.check.some(check => (check.id === userid && check.state === key))
    )
});

const getAttendanceQJ = (userid: string) => {
  return getStatisticsSimulateCount.value(AttendanceEnum.BJ, userid).length + getStatisticsSimulateCount.value(AttendanceEnum.SJ, userid).length
}

const getAttendanceWJ = (userid: string) => {
  return getStatisticsSimulateCount.value(AttendanceEnum.WD, userid).length + getStatisticsSimulateCount.value(AttendanceEnum.KK, userid).length
}

emitter.on('updateUserList', () => {
  getUserList(classID.value);
})
</script>

<style lang="scss" scoped>
.page-content {
  width: 100%;
  height: 100%;

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

  .user-add-dialog-body-box {
    width: 100%;
    height: 75vh;
    display: flex;
    justify-content: center;
    overflow: auto;
    overflow-x: hidden;
  }
}
</style>
