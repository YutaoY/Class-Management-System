<template>
  <div class="page-content">
    <el-table :data="allFileList" :default-sort="{ prop: 'size', order: 'ascending' }">
      <el-table-column label="上传者" prop="avatar" #default="scope" width="150px" :filters="userOption" column-key="user"
        :filter-method="filterUser">
        <div class="user" style="display: flex; align-items: center">
          <el-avatar class="avatar" :src="useUserInfo(scope.row.userid).avatar">
            <img :src="avatar" />
          </el-avatar>
          <div>
            <el-text class="user-name"
              :type="useUserInfo(scope.row.userid).sex === UserSex.MALE ? 'primary' : 'danger'">
              {{ useUserInfo(scope.row.userid).name }}
            </el-text>
          </div>
        </div>
      </el-table-column>
      <el-table-column label="班级" prop="class" #default="scope" width="100px" :filters="classOption" column-key="class"
        :filter-method="filterClass">
        <el-text>{{ useClassInfo(scope.row.classid).name }}</el-text>
      </el-table-column>
      <el-table-column label="文件名" prop="name" #default="scope" width="150px">
        <el-text @click="getFileDown(scope.row)" type="primary" style="cursor: pointer">{{
          scope.row.name
        }}</el-text>
      </el-table-column>
      <el-table-column label="文件大小" prop="size" #default="scope" width="125px" sortable>
        <el-text :type="getFileSize(scope.row.size).type">
          {{ getFileSize(scope.row.size).size }}
        </el-text>
      </el-table-column>
      <el-table-column label="文件类型" prop="size" #default="scope" width="100px">
        <el-text type="info">
          {{ getFileType(scope.row.name) }}
        </el-text>
      </el-table-column>
      <el-table-column label="是否公开" #default="scope" width="100px">
        <el-switch v-model="scope.row.isOpen" inline-prompt
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="公开" inactive-text="私密"
          disabled />
      </el-table-column>
      <el-table-column label="是否加密" #default="scope" width="100px">
        <el-switch v-model="scope.row.isPaw" inline-prompt
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #999" active-text="加密" inactive-text="不加密"
          disabled />
      </el-table-column>
      <el-table-column label="状态" prop="state" sortable width="150px">
        <template #default="scope">
          <el-select v-model="scope.row.newState" placeholder="更改文件状态">
            <el-option v-for="item in fileStateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" prop="time" #default="scope" width="200px">
        {{ dayjs(Number(scope.row.time)).format('YYYY-MM-DD HH:mm') }}
      </el-table-column>
      <el-table-column fixed="right" label="操作" #default="scope">
        <el-button v-if="scope.row.state !== scope.row.newState" link :icon="Edit" type="primary"
          @click="updateFileState(scope.row)">更改状态</el-button>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang='ts'>
import { ClassRequest } from '@/api/classApi';
import { FileRequest } from '@/api/fileApi';
import { UserRequest } from '@/api/usersApi';
import { FileState, UserSex } from '@/enums/appEnum';
import { getFileSize } from '@/store/modules/file';
import { ClassInfo, FileInfo, UserInfo } from '@/types/store';
import avatar from "@/assets/img/avatar/avatar.jpg";
import { getFileDown, getFileType } from '@/utils/flie';
import { ApiStatus } from '@/utils/http/status';
import { fileStateOptions } from '@/utils/options';
import { Edit } from '@element-plus/icons-vue'
import { dayjs, ElMessage, ElSelect } from 'element-plus';
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user';

interface UpdataFileInfo extends FileInfo {
  newState: FileState
}
const userStore = useUserStore()
const settingStore = useSettingStore()

const userInfo = computed(() => userStore.getUserInfo)

const allFileList = ref<UpdataFileInfo[]>([]);
const userInfoList = ref<UserInfo[]>([]);
const classInfoList = ref<ClassInfo[]>([]);

const userOption = ref<{
  text: string
  value: string
}[]>([]);
const classOption = ref<{
  text: string
  value: string
}[]>([]);

onMounted(async () => {
  const allFileListReq = await FileRequest.getAll();
  if (allFileListReq.err === ApiStatus.success) {
    if (userStore.getIsAdmin) 
    allFileList.value = allFileListReq.result;
    else allFileList.value = (allFileListReq.result as UpdataFileInfo[]).filter(item => item.classid === userInfo.value.class);
  } else ElMessage.error(allFileListReq.result);

  allFileList.value.forEach(async (item, index) => {
    allFileList.value[index].newState = item.state;
    await getUserData(item.userid as string);
    if (item.classid)
      await getClassData(item.classid);
  })
})

const filterUser = (value: string, row: FileInfo) => {
  return row.userid === value
}

const filterClass = (value: string, row: FileInfo) => {
  return row.classid === value
}

const getUserData = async (userid: string) => {
  if (userInfoList.value.filter((item) => item.id === userid).length === 0) {
    const userData = await UserRequest.get({ userid });
    if (userData.err === ApiStatus.success) {
      if (userOption.value.filter((item) => item.value === userid).length === 0)
        userOption.value.push({ value: userid, text: userData.result.name });
      userInfoList.value.push(userData.result);
    }
  }
}

const getClassData = async (classid: string) => {
  if (classInfoList.value.filter((item) => item.id === classid).length === 0) {
    const classData = await ClassRequest.get({ classid });
    if (classData.err === ApiStatus.success) {
      if (classOption.value.filter((item) => item.value === classData.result.id).length === 0)
        classOption.value.push({ value: classData.result.id, text: classData.result.name })
      classInfoList.value.push(classData.result);
    }
  }
}

const useUserInfo = (userid: string): UserInfo => {
  const filterData = userInfoList.value.filter((item) => item.id == userid);
  if (filterData.length > 0)
    return filterData[0];
  else return {} as UserInfo;
}

const useClassInfo = (classid: string): ClassInfo => {
  const filterData = classInfoList.value.filter((item) => item.id == classid);
  if (filterData.length > 0)
    return filterData[0];
  else return {} as ClassInfo;
}

const updateFileState = async (item: UpdataFileInfo) => {
  const res = await FileRequest.update(item.id, item.newState);
  if (res.err === ApiStatus.success) {
    ElMessage.success("更改状态成功");
    settingStore.reload();
  } else ElMessage.error(res.result);
}
</script>

<style scoped>
.page-content {
  width: 100%;
  height: 100%;

  .card-header {
    width: 100%;
    display: flex;
    align-self: center;
    justify-content: space-between;
  }

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
</style>