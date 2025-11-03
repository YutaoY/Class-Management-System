<template>
  <div class="page-content">
    <el-upload class="upload-demo" drag multiple :on-change="handleChange" :auto-upload="false" :show-file-list="false">
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到此处 <em>点我选择文件</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          单个文件最大{{ file.setting.MAX_FILE_SIZE }}MB
          单次可上传{{ file.setting.MAX_FILE_LENGTH }}个文件
        </div>
      </template>
    </el-upload>
    <!-- 待文件提交 -->
    <template v-if="file.list.length > 0">
      <el-divider>文件待提交数据</el-divider>
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <el-text size="large">&nbsp;文件夹名：</el-text>&nbsp;
              <el-input v-model.trim="file.folder" style="width: 300px" placeholder="不填将以上传时间作为文件夹名展示" />
            </div>
            <div>
              <el-button type="danger" @click="deleteFileList">清空列表</el-button>
              <el-button type="primary" @click="uploadFileAll" :icon="Upload" :loading="file.load">提交上传</el-button>
            </div>
          </div>
        </template>
        <el-table :data="file.list" style="width: 100%" table-layout="fixed">
          <el-table-column label="文件名" width="200">
            <template #default="scope">
              <el-text type="primary">{{ scope.row.name }}</el-text>
            </template>
          </el-table-column>
          <el-table-column label="文件大小" width="150">
            <template #default="scope">
              <el-text :type="getFileSize(scope.row.size).type">{{ getFileSize(scope.row.size).size }}</el-text>
            </template>
          </el-table-column>
          <el-table-column label="文件类型" width="125">
            <template #default="scope">
              <el-text>{{ getFileType(scope.row.name) }}</el-text>
            </template>
          </el-table-column>
          <el-table-column label="是否公开" width="100">
            <template #default="scope">
              <el-switch v-model="scope.row.isOpen" :disabled="scope.row.status !== 'ready'" />
            </template>
          </el-table-column>
          <el-table-column label="是否加密" width="100">
            <template #default="scope">
              <el-switch v-model="scope.row.isPaw" :disabled="scope.row.status !== 'ready'" />
            </template>
          </el-table-column>
          <el-table-column label="文件密码" width="250">
            <template #default="scope">
              <el-input v-if="scope.row.isPaw" v-model="scope.row.password" type="password" placeholder="请输入4-16位的文件保护密码"
               :disabled="scope.row.status !== 'ready'" :maxlength="16" :minlength="4" />
              <el-text v-else type="info">(未启用加密，无密码)</el-text>
            </template>
          </el-table-column>
          <el-table-column label="上传状态" width="150">
            <template #default="scope">
              <el-tag effect="light" :type="getFileState(scope.row.status).type">
                {{ getFileState(scope.row.status).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button text v-if="scope.row.status === 'ready'" type="danger" @click="handleDelete(scope.row.uid)">
                取消上传
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup lang='ts'>
import { UploadFilled } from '@element-plus/icons-vue'
import { file, getFileSize, handleChange, handleDelete, uploadFileAll } from '@/store/modules/file'
import { getFileType } from '@/utils/flie'
import { Upload } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { EpPropMergeType } from 'element-plus/es/utils'

const from = reactive({
  password: '',
  isPaw: false,
  isOpen: false
})

watch(() => from.isPaw, (value) => {
  if (!value) from.password = '';
})

const getFileState = (state: 'ready' | 'uploading' | 'success' | 'fail'): { text: string, type: EpPropMergeType<StringConstructor, "info" | "success" | "danger" | "warning" | "primary", unknown> } => {
  switch (state) {
    case "ready":
      return {
        text: "等待上传",
        type: "info"
      }
    case "uploading":
      return {
        text: "上传中",
        type: "warning"
      }
    case "success":
      return {
        text: "上传成功",
        type: "success"
      }
    case "fail":
      return {
        text: "上传失败",
        type: "danger"
      }
    default:
      return {
        text: "未知",
        type: "info"
      }
  }
}

const deleteFileList = () => {
  ElMessageBox.confirm(
    `是否清空列表`,
    '提醒！', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    file.list = [];
  })
}
</script>

<style scoped lang='scss'>
.page-content {
  width: 100%;
  height: 100%;

  .card-header {
    width: 100%;
    height: 100%;
    display: flex;
    align-self: center;
    justify-content: space-between;
  }

  .file-from {
    width: 100%;
    display: flex;
    align-self: center;
    justify-content: center;
    border: 1px solid #e2e2e2;
    box-shadow: 0 0 1px gray;
    border-radius: 10px;
    padding: 1em 0;

    .form-inline {
      width: 95%;
      height: auto;
      display: flex;
      justify-content: space-around;

      .el-form-item {
        margin-bottom: 0 !important;
      }

      .el-input {
        --el-input-width: 220px;
      }

      .el-select {
        --el-select-width: 220px;
      }
    }
  }
}
</style>