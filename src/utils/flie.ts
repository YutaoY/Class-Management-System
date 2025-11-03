import { FileRequest } from "@/api/fileApi";
import { ApiStatus } from "./http/status";
import { ElMessage, ElMessageBox } from "element-plus";
import { FileInfo } from "@/types/store";
import { Md5 } from "ts-md5";
import { FileState } from "@/enums/appEnum";

const inputValidator = (paw: string) => {
  if (!paw) return "请输入密码！";
  else return true;
}

export function getFileType(fileName: string) {
  // 后缀获取
  let suffix = '';
  // 获取类型结果
  let result = true;
  if (!fileName) return false;
  try {
    // 截取文件后缀
    suffix = fileName.substr(fileName.lastIndexOf('.') + 1, fileName.length)
    // 文件后缀转小写，方便匹配
    suffix = suffix.toLowerCase()
  } catch (err) {
    suffix = '';
  }
  // fileName无后缀返回 false
  if (!suffix) {
    result = false;
    return result;
  }

  let fileTypeList = [
    { 'typeName': '图片', 'types': ['png', 'jpg', 'jpeg', 'bmp', 'gif'] },
    { 'typeName': '文本', 'types': ['txt'] },
    { 'typeName': '表格文档', 'types': ['xls', 'xlsx'] },
    { 'typeName': '文字文档', 'types': ['doc', 'docx'] },
    { 'typeName': '便携式文档', 'types': ['pdf'] },
    { 'typeName': '演示文档', 'types': ['ppt', 'pptx'] },
    { 'typeName': '视频', 'types': ['mp4', 'm2v', 'mkv'] },
    { 'typeName': '音频', 'types': ['mp3', 'wav', 'wmv'] },
    { 'typeName': '压缩包', 'types': ['zip', 'rar', '7z'] },
    { 'typeName': '可执行文件', 'types': ['exe'] },
    { 'typeName': '源码', 'types': ['c', 'cpp', 'java', 'py', 'go', 'js', 'ts'] },
    { 'typeName': '可处理图像', 'types': ['psd'] }
  ]
  for (let i = 0; i < fileTypeList.length; i++) {
    const fileTypeItem = fileTypeList[i]
    const typeName = fileTypeItem.typeName
    const types = fileTypeItem.types
    result = types.some(function (item) {
      return item === suffix;
    });
    if (result) return typeName
  } return '其他'
}

const _getFileDown = async (fileid: string, password: string) => {
  const res = await FileRequest.download({
    fileid, password
  })

  if (res.data.err === ApiStatus.success) {
    const a = document.createElement("a");
    a.href = (res.config.url as string) + '&down=true';
    a.click();
  }
  else ElMessage.error(res.data.result);
}

export const getFileDown = async (file: FileInfo) => {
  switch (file.state) {
    case FileState.ABNORMAL:
      ElMessage.error('文件状态异常！禁止下载！');
      break;
    case FileState.DELETE:
      ElMessage.error('文件已被删除！');
      break;
    case FileState.WAITING:
      ElMessage.error('文件审核中，请稍后再试！');
      break;
    case FileState.SUCCESS:
      if (!file.isPaw) _getFileDown(file.id, '(NoPassword)');
      else ElMessageBox.prompt('该文件启用了加密保护，需输入正确密码下载', '提醒！', {
        showClose: false,
        inputType: "text",
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValidator: inputValidator
      })
        .then(({ value }) => {
          _getFileDown(file.id, new Md5().appendAsciiStr(value).end() as string);
        })
      break;
    default:
      ElMessage.error('未知文件状态码！');
      break;
  }
}