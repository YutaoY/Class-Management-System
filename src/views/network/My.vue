<template>
  <div class="page-content">
    <el-table :data="myFileList" :default-sort="{ prop: 'size', order: 'ascending' }">
      <el-table-column label="文件名" prop="name" #default="scope">
        <el-text @click="getFileDown(scope.row)" type="primary" style="cursor: pointer;">
          {{ scope.row.name }}</el-text>
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
      <el-table-column label="状态" prop="state" sortable width="100px">
        <template #default="scope">
          <el-tag :type="getTagType(scope.row.state)">
            {{ fileStateOptions.find(item => item.value === scope.row.state)?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" prop="time" #default="scope" width="200px">
        {{ dayjs(Number(scope.row.time)).format('YYYY-MM-DD HH:mm') }}
      </el-table-column>
      <el-table-column fixed="right" label="操作" #default="scope" width="200px">
        <el-button link :icon="Delete" v-if="scope.row.state !== FileState.DELETE" type="danger"
          @click="deleteFile(scope.row)">删除</el-button>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang='ts'>
import { FileRequest } from '@/api/fileApi';
import { FileState } from '@/enums/appEnum';
import { file, getFileSize } from '@/store/modules/file';
import { useSettingStore } from '@/store/modules/setting';
import { FileInfo } from '@/types/store';
import { getFileDown, getFileType } from '@/utils/flie';
import { ApiStatus } from '@/utils/http/status';
import { fileStateOptions } from '@/utils/options';
import { Delete } from '@element-plus/icons-vue'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';

const myFileList = ref<FileInfo[]>([]);
const folderList = ref<{ text: string, value: string }[]>([]);

onMounted(async () => {
  const myFileListReq = await FileRequest.getUser();
  if (myFileListReq.err === ApiStatus.success) {
    myFileList.value = myFileListReq.result;
  } else ElMessage.error(myFileListReq.result);

  const groupedTasks = myFileList.value.reduce<Record<string, FileInfo[]>>((acc, task) => {
    const folder = task.folder;

    if (!acc[folder])
      acc[folder] = []; // 初始化数组

    acc[folder].push(task); // 将任务添加到相应的状态数组中
    return acc;
  }, {});

  let key: keyof Record<string, FileInfo[]>;
  for (key in groupedTasks) {
    folderList.value.push({
      text: key, value: key
    })
  }
})

const filterFolder = (value: string, row: FileInfo) => {
  return row.folder === value
}

const getTagType = (value: number) => {
  switch (value) {
    case -1: return 'danger';
    case 0: return 'warning';
    case 1: return 'success';
    default: return 'info';
  }
}

const deleteFile = (item: FileInfo) => {
  ElMessageBox.confirm(
    `是否删除文件：${item.name}`,
    '警告！', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      const res = await FileRequest.update(item.id, FileState.DELETE);
      if (res.err === ApiStatus.success) {
        ElMessage.success("删除成功");
        useSettingStore().reload();
      } else ElMessage.error(res.result);
    })
}
</script>

<style scoped>
.page-content {
  width: 100%;
  height: 100%;
  position: relative;

  .card-header {
    width: 100%;
    display: flex;
    align-self: center;
    justify-content: space-between;
  }

  .padd{
    width: 100%;
    display: flex;
    height: auto;
    padding: 10vh 0;
  }

  .affix-box {
    width: 100%;
    position: absolute;
    right: 1em;
    bottom: 1em;
    display: flex;
    justify-content: end;
  }
}
</style>