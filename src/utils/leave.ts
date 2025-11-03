import { LeaveRequest } from "@/api/leaveApi";
import { ElMessage } from "element-plus";
import { ApiStatus } from "./http/status";
import { ElLoading } from 'element-plus'
import { Md5 } from 'ts-md5';
import { LeaveInfo, useLeaveStore } from "@/store/modules/leave";
import { useClassStore } from "@/store/modules/class";
import { userData } from "./data";
import { socket } from "./socket";
import { useUserStore } from "@/store/modules/user";

const leaveStore = useLeaveStore()
const userInfo = computed(() => {
  return useUserStore().getUserInfo
})
const classInfo = computed(() => {
  return useClassStore().getClassInfo
})

export const leavedata = reactive<{
  img: string
  other: boolean
  data: {
    user: string
    name: string
    pass: boolean
    start: string
    end: string
    type: string
    text: string
  }
  leaveDialogVisible: boolean
}>({
  img: '',
  other: false,
  data: {
    user: '',
    name: '',
    pass: false,
    start: '',
    end: '',
    type: '',
    text: ''
  },
  leaveDialogVisible: false
})

export const leaveOpen = () => {
  leavedata.img = '';
  leavedata.leaveDialogVisible = true;
  if (leaveStore.getIsLeave) {
    const leaveInfo = leaveStore.getLeaveInfo
    leavedata.data = {
      user: userInfo.value.id as string,
      name: userData.value.use(leaveInfo.user).name,
      pass: true,
      start: leaveInfo.start,
      end: leaveInfo.end,
      type: leaveInfo.type,
      text: leaveInfo.text
    }
  }
}

export const leaveClick = (other: boolean) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.jpeg,.jpg';
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      const FileExt = file.name.split('.').pop() as string;
      if (['jpg'].indexOf(FileExt.toLowerCase()) === -1) {
        return ElMessage.warning('请选择JPG图片文件！');
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
        if (reader.result) {
          leavedata.other = other;
          leavedata.img = reader.result as string;
          leavedata.leaveDialogVisible = true;
        } else {
          ElMessage.error('文件读取失败！');
        }
      };
    }
  }
  input.click();
}

export const leaveSend = async () => {
  if (!leavedata.img)
    return ElMessage.warning('请选择图片！');

  leavedata.leaveDialogVisible = false;
  const loadingInstance = ElLoading.service({
    text: '正在提交...',
  })

  const params = {
    img: leavedata.img,
    other: leavedata.other,
    class: classInfo.value.id as string,
    md5: new Md5().appendAsciiStr(leavedata.img).end() as string,
  }

  const res = await LeaveRequest.add(params)
  loadingInstance.close()
  if (res.err === ApiStatus.success) {
    leavedata.img = '';
    leavedata.data = res.result;
    await leaveStore.setList()
    socket.emit('leave-add')
    ElMessage.success('提交成功！');
    leavedata.leaveDialogVisible = true;
  } else ElMessage.error(res.result);
}

export const leaveClose = () => {
  leavedata.img = '';
  leavedata.data.pass = false
}