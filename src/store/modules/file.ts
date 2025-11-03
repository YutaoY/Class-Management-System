import { reactive } from "vue";
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadFile } from 'element-plus'
import { EpPropMergeType } from "element-plus/es/utils";
import { FileUpload } from "@/types/store";
import { FileRequest } from "@/api/fileApi";
import { UserRequest } from "@/api/usersApi";
import { ApiStatus } from "@/utils/http/status";
import { useUserStore } from "./user";
import { PowerType } from "@/enums/appEnum";

// UploadStatus = 'ready' | 'uploading' | 'success' | 'fail'

export const file = reactive<{
  list: FileUpload[]
  load: boolean
  folder: string
  setting: {
    MAX_FILE_SIZE: number
    MAX_FILE_LENGTH: number
  }
}>({
  list: [],
  folder: '',
  load: false,
  setting: {
    MAX_FILE_SIZE: 50,
    MAX_FILE_LENGTH: 9
  }
})

export const handleChange: UploadProps['onChange'] = async (uploadFile) => {
  if (uploadFile.size === 0) return

  if (file.load) return ElMessage({
    message: "请等待已提交文件上传完成！",
    type: 'warning',
    plain: true,
    duration: 3000
  })

  if (file.list.length >= file.setting.MAX_FILE_LENGTH)
    return ElMessage({
      message: `最多上传${file.setting.MAX_FILE_LENGTH}个文件`,
      type: 'error',
      plain: true,
      duration: 3000
    })

  if (file.list.filter((item) => item.name === uploadFile.name).length > 0)
    return ElMessage({
      message: `重复文件名：${uploadFile.name}`,
      type: 'error',
      plain: true,
      duration: 5000
    })

  if (getFileSize(uploadFile.size as number).type === 'danger' && (useUserStore().getUserInfo.power as PowerType) < PowerType.ADMIN)
    return ElMessage({
      message: `文件过大：${uploadFile.name}`,
      type: 'error',
      plain: true,
      duration: 5000
    })

  handleAddList(uploadFile);
}

export const handleAddList = (filedata: UploadFile) => {
  const data = {
    isPaw: false,
    isOpen: false,
    password: ''
  }
  file.list.push({ ...data, ...filedata } as FileUpload);
}

export const handleDelete = (fileuid: number) => {
  file.list.forEach((item, index) => {
    if (item.uid === fileuid)
      ElMessageBox.confirm(
        `是否删除文件 ${item.name}`,
        '提醒！', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        file.list.splice(index, 1)
      })
  })
}

export const getFileSize = (size: number): { size: string, type: EpPropMergeType<StringConstructor, "" | "info" | "success" | "danger" | "warning" | "primary", unknown> | undefined } => {
  if (!size) return {
    size: '',
    type: 'info'
  };

  const kb = size / 1024;
  if (!(kb > 1)) return {
    size: `${size.toFixed(2)}B`,
    type: 'success'
  };

  const mb = kb / 1024;
  if (!(mb > 1)) return {
    size: `${kb.toFixed(2)}KB`,
    type: 'success'
  };

  const gb = mb / 1024;
  if (!(gb > 1)) {
    if (mb > file.setting.MAX_FILE_SIZE) return {
      size: `${mb.toFixed(2)}MB`,
      type: 'danger'
    };
    if (mb > (file.setting.MAX_FILE_SIZE * 0.5)) return {
      size: `${mb.toFixed(2)}MB`,
      type: 'warning'
    };
    return {
      size: `${mb.toFixed(2)}MB`,
      type: 'success'
    };
  }

  return {
    size: `${gb.toFixed(2)}GB`,
    type: 'danger'
  };
}

const uploadFileItem = async (index: number) => {
  const fileItem = file.list[index];
  if (index < file.list.length) {
    if (fileItem.status === 'ready') {
      const repeat = await FileRequest._upload(fileItem.name);
      if (repeat.err !== ApiStatus.success) {
        ElMessage.error(`${fileItem.name}：文件名重复！`);
        return uploadFileItem(index + 1);
      }
      file.load = true;
      file.list[index].status = 'uploading';
      fileItem.class = useUserStore().info.class || undefined;
      if (file.folder === '') file.folder = dayjs().format('YYYY-MM-DD HH:mm');
      await FileRequest.upload({
        body: fileItem, folder: file.folder
      }).then((res) => {
        if (res.data.err === ApiStatus.success) {
          file.list[index].status = 'success';
        } else {
          file.list[index].status = 'fail';
          ElMessage.error(`${fileItem.name}：上传失败！`)
        }
      }).catch(() => {
        file.list[index].status = 'fail';
        ElMessage.error(`${fileItem.name}：服务器出错！`);
      }).finally(() => {
        if (index === file.list.length - 1)
          return file.load = false;
        uploadFileItem(index + 1);
      })
    } else return uploadFileItem(index + 1);
  }
}

const filePawCheck = async (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const pawList = file.list.filter(item => item.isPaw);
    if (pawList.length > 0) pawList.forEach(item => {
      if (!item.password || item.password.length < 3) {
        ElMessage.error(`${item.name}：请输入4-10位字符的密码！`);
        return resolve(false);
      }
    })
    resolve(true);
  })
}

export const uploadFileAll = async () => {
  const verify = await UserRequest.verify();
  if (verify.err === ApiStatus.success) {
    const check = await filePawCheck();
    if (check) uploadFileItem(0);
  } else ElMessage.error("权限无效，操作失败！");
}