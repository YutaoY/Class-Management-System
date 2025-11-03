<template>
  <div class="page-content">
    <el-table :data="classFileList" :default-sort="{ prop: 'time', order: 'descending' }">
      <el-table-column label="上传者" prop="avatar" #default="scope" width="200px">
        <div class="user" style="display: flex; align-items: center">
          <el-avatar class="avatar" shape="square" :src="userData.use(scope.row.userid).avatar">
            <img :src="avatar" />
          </el-avatar>
          <div>
            <el-text class="user-name"
              :type="userData.use(scope.row.userid).sex === UserSex.MALE ? 'primary' : 'danger'">
              {{ userData.use(scope.row.userid).name }}
            </el-text>&nbsp;
            <el-tag v-show="userInfo.id === scope.row.userid" type="success" size="small" round>我</el-tag>
          </div>
        </div>
      </el-table-column>
      <el-table-column label="文件名" prop="name" #default="scope" width="300px">
        <el-text @click="getFileDown(scope.row)" type="primary" style="cursor: pointer;">{{
          scope.row.name
        }}</el-text>
      </el-table-column>
      <el-table-column label="文件大小" prop="size" #default="scope" width="150px" sortable>
        <el-text :type="getFileSize(scope.row.size).type">
          {{ getFileSize(scope.row.size).size }}
        </el-text>
      </el-table-column>
      <el-table-column label="文件类型" prop="size" #default="scope" width="150px">
        <el-text type="info">
          {{ getFileType(scope.row.name) }}
        </el-text>
      </el-table-column>
      <el-table-column label="是否加密" #default="scope" width="150px">
        <el-switch v-model="scope.row.isPaw" inline-prompt
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #999" active-text="加密" inactive-text="不加密"
          disabled />
      </el-table-column>
      <el-table-column label="上传时间" prop="time" #default="scope" sortable>
        {{ dayjs(Number(scope.row.time)).format('YYYY-MM-DD HH:mm') }}
      </el-table-column>
      <el-table-column fixed="right" label="" #default="scope">
        <el-button link :icon="Download" type="danger" @click="getFileDown(scope.row)">下载</el-button>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang='ts'>
import { FileRequest } from '@/api/fileApi';
import { PowerType, UserSex } from '@/enums/appEnum';
import { router } from '@/router';
import { getFileSize } from '@/store/modules/file';
import { useUserStore } from '@/store/modules/user';
import { FileInfo } from '@/types/store';
import avatar from "@/assets/img/avatar/avatar.jpg";
import { getFileDown, getFileType } from '@/utils/flie';
import { ApiStatus } from '@/utils/http/status';
import { dayjs, ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue'
import { userData } from '@/utils/data';

const classFileList = ref<FileInfo[]>([]);
const userInfo = useUserStore().getUserInfo;

onMounted(async () => {
  goToFile();
  if (!userInfo.class) return;
  const classFileListReq = await FileRequest.getClass(userInfo.class);
  if (classFileListReq.err === ApiStatus.success) {
    classFileList.value = classFileListReq.result;
  } else ElMessage.error(classFileListReq.result);
})


const goToFile = () => {
  if (userInfo.power === PowerType.ADMIN && !userInfo.class) {
    router.push({ path: `/network/file` })
  }
}
</script>

<style scoped>
.page-content {
  width: 100%;
  height: 100%;

  .el-descriptions {
    margin-top: 20px;
  }

  .cell-item {
    display: flex;
    align-items: center;
  }

  .margin-top {
    margin-top: 20px;
  }

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