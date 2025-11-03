import { useClassStore } from "@/store/modules/class";
import { useUserStore } from "@/store/modules/user";
import { io } from "socket.io-client";
import { taskData } from "./data";
import { TaskInfo } from "@/types/store";
import { TaskType } from "@/enums/appEnum";
import { emitter } from "./event";
import { ElMessageBox, ElNotification, NotificationHandle } from "element-plus";
import { router } from "@/router";

let delaySetTimeout: number;
let elNotification: null | NotificationHandle;
const delayArr = ref<number[]>([]);
const delayStartTime = ref<number>(0);

const userinfo = computed(() => useUserStore().getUserInfo);
const classinfo = computed(() => useClassStore().getClassInfo);

const socketBaseUrl = import.meta.env.VITE_API_URL;
const socketLocalUrl = "http://localhost:6621/class" //本地测试;

const socketUrl = process.env.NODE_ENV === 'development' ? socketLocalUrl : socketBaseUrl

export const delay = ref<number>(-1);
export const online = ref<string[]>([]);

export const socket = io(socketUrl, {
  auth: (cb) => {
    cb({
      userid: userinfo.value.id,
      classid: classinfo.value.id
    });
  }
});

socket.on("connect", () => {
  if (!userinfo.value.id || !classinfo.value.id)
    return

  // 任务数据监听
  socket.on("task-add", (data: TaskInfo) => {
    if (data.user === userinfo.value.id)
      return

    if (data.type === TaskType.WORK) {
      emitter.emit('addWorkTip', data);
      return
    }

    taskData.value.add(data);

    if (data.type === TaskType.ARRIVE)
      ElMessageBox.confirm(
        `接收到一份名为 ${data.title} 的考勤任务，请及时配合负责人完成考勤！`,
        '考勤任务提醒',
        {
          confirmButtonText: '查看',
          cancelButtonText: '关闭',
          type: 'warning',
        }).then(() => {
          router.push({
            path: `/task/get`,
            query: {
              id: data.id
            }
          })
        })

    if (data.type === TaskType.NOTICE) {
      const eln = ElNotification({
        title: '新的通知',
        message: h('p', { style: 'cursor: pointer' }, [
          h('span', null, data.title),
          h('i', { style: 'color: red' }, '点击查看'),
        ]),
        onClick() {
          eln.close()
          router.push({
            path: `/task/get`,
            query: {
              id: data.id
            }
          })
        },
      })
    }

  })

  socket.on("task-update", (data: TaskInfo) => {
    if (data.user === userinfo.value.id) return
    taskData.value.update(data);
  })

  socket.on("task-update-list", (data) => {
    if (data.user === userinfo.value.id) return
    taskData.value.updateList(data)
  })

  socket.on("task-delete", (taskid: string) => {
    taskData.value.dele(taskid);
  })

  socket.on("on-line", (data: string[]) => {
    online.value = data;
  });
});

export const delayStart = async () => {
  delayStartTime.value = new Date().getTime();
  delaySetTimeout = Number(setTimeout(() => {
    delay.value = -1;
  },10000))
  socket.emit("delay", () => {
    if (delaySetTimeout) clearTimeout(delaySetTimeout);
    if (delayArr.value.length > 9) delayArr.value.shift();
    if (delayArr.value.length < 10)
      delayArr.value.push((new Date().getTime() - delayStartTime.value) * 0.75);
    let delayNub = 0;
    delayArr.value.forEach(item => {
      delayNub += item;
    })
    delay.value = Math.round(delayNub / delayArr.value.length);
    if (delay.value > 999) delay.value = 999;
    setTimeout(() => {
      delayStart();
    }, 1000);
  })
}