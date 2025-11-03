<template>
  <div class="page" v-if="showPrintPDF">
    <div class="page-content">
      <p class="title">{{ classInfo.school }}教学考勤表（教师用表）</p>
      <div class="sub-title">
        <p>专业班级：{{ classInfo.name }}</p>
        <p>课程名称：{{ handList[0].title }}</p>
        <p>课程性质：</p>
        <p>任课教师：</p>
      </div>
      <div class="table">
        <div class="top-table">
          <div class="item1">序<br>列</div>
          <div class="item2">
            <div class="line"></div>
            <span class="rt">考勤时间</span>
            <span class="bl">学生姓名</span>
          </div>
          <div class="item3">
            <div class="top">考勤记录</div>
            <div class="bottom">
              <span v-for="item in 25">
                {{ item <= handList.length ? dayjs(Number(handList[item - 1].start)).format("MM DD") : '' }} </span>
            </div>
          </div>
          <div class="item4">汇总</div>
        </div>
        <div class="content-table">
          <div class="table-item" v-for="(stulist, stuindex) in classStore.getClassList">
            <div class="item1">{{ stuindex + 1 }}</div>
            <div class="item2">{{ stulist.name }}</div>
            <div class="item3">
              <span v-for="taskindex in 25">
                {{ taskindex <= handList.length ? getPrintAttendance(taskindex - 1, stulist.id) : '' }} </span>
            </div>
            <div class="item4"></div>
          </div>
        </div>
        <div class="bottom-table">
          <div>说明：</div>
          <div class="text">
            <p>1、此表用于任课教师对各课程所在班级的学生进行考勤</p>
            <p>2、课程性质指必修或选修</p>
            <p>3、表示符号：出勤（√）、旷课（X）、病假（⚫）、事假（▲）、迟到（#）、早退（※）</p>
            <p>4、本表每学期结束时上交院教务处</p>
            <p>5、学院教务处或教学督导室教学考勤表的填写情况不定期进行抽查，必要时间全院公示。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { AttendanceEnum } from '@/enums/classEnum';
import { useClassStore } from '@/store/modules/class';
import { TaskInfo } from '@/types/store';
import { emitter } from '@/utils/event';
import { shareAttendanceList, showPrintPDF } from '@/utils/share';
import dayjs from 'dayjs';

const handList = ref<TaskInfo[]>([])

const classStore = useClassStore();
const classInfo = computed(() => {
  return classStore.info
});

const getPrintAttendance = (taskIndex: number, userid: string) => {
  const taskItem = handList.value[taskIndex];
  const state = taskItem.list.check.filter(item => item.id === userid)[0].state

  switch (state) {
    case AttendanceEnum.YD:
      return '√';

    case AttendanceEnum.ZT:
      return '※';

    case AttendanceEnum.CD:
      return '#';

    case AttendanceEnum.BJ:
      return '⚫';

    case AttendanceEnum.SJ:
      return '▲';

    case AttendanceEnum.WD:
      return 'X';

    case AttendanceEnum.KK:
      return 'X';

    default:
      break;
  }
}

emitter.on('printPDF', () => {
  showPrintPDF.value = false
  handList.value = shareAttendanceList.value.flatMap(item => item.attendance);
  nextTick(() => {
    const title = `${classInfo.value.name}【${handList.value[0].title}】课程考勤表(${dayjs(Number(handList.value[0].start)).format("YYYY年MM月DD日")}-${dayjs(Number(handList.value[handList.value.length - 1].start)).format("YYYY年MM月DD日")})`;
    document.title = title;
    showPrintPDF.value = true
    console.log(handList.value)
    setTimeout(() => {
      window.print()
    }, 1000);
  })
})

</script>

<style lang="scss" scoped>
.page {
  width: 100%;
  height: 100vh;
  text-align: center;
  background-color: white;

  .page-content {
    width: 100%;
    height: auto;
    overflow: auto;


    .title {
      width: 100%;
      font-size: 1.44em;
      font-weight: bolder;
    }

    .sub-title {
      width: 100%;
      display: grid;
      text-align: left !important;
      grid-template-columns: 1.5fr 1.5fr 1fr 1fr;
      font-weight: bold;
      margin: 1em 0;
    }

    .table {
      width: 100%;

      .top-table {
        width: 100%;
        height: 50px;
        display: grid;
        grid-template-columns: 1fr 5fr 25fr 2fr;

        >.item1 {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        >.item2 {
          width: 100%;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;

          .rt {
            font-size: 12px;
            position: absolute;
            right: 5px;
            top: 5px;
          }

          .bl {
            font-size: 12px;
            position: absolute;
            bottom: 5px;
            left: 5px;
          }

          .line {
            width: 50px;
            height: 1px;
            border: none;
            border-top: 1px solid black;
            transform: rotate(35deg);
          }
        }

        >.item3 {
          .top {
            width: 100%;
            height: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .bottom {
            width: 100%;
            height: 25px;
            display: grid;
            flex-wrap: wrap;
            /* 允许换行 */
            grid-template-columns: repeat(auto-fill, minmax(21px, 1fr));
            // grid-template-columns: repeat(25, 1fr);

            >span {
              width: 100%;
              height: 100%;
              display: flex;
              font-size: 10px;
              justify-content: center;
              align-items: center;
              text-align: center;
              border: 1px solid black;
              border-bottom: none;
            }
          }
        }

        >.item4 {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        >div {
          border: 1px solid black;
        }
      }

      .content-table {
        width: 100%;
        height: auto;
        border-top: 1px solid black;

        .table-item {
          width: 100%;
          height: 20px;
          display: grid;
          grid-template-columns: 1fr 5fr 25fr 2fr;

          >.item1 {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            border-left: 1px solid black;
          }

          >.item2 {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            border-left: 1px solid black;
          }

          >.item3 {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(21px, 1fr));
            // grid-template-columns: repeat(25, 1fr);
            border-left: 1px solid black;

            >span {
              width: 100%;
              height: 100%;
              display: flex;
              font-size: 10px;
              justify-content: center;
              align-items: center;
              text-align: center;
              border-left: 0.5px solid black;
              border-right: 0.5px solid black;
            }
          }

          >.item4 {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            border-left: 1px solid black;
          }

          >div {
            padding: 0 !important;
            margin: 0 !important;
            border-bottom: 0.5px solid black;
          }
        }
      }

      .bottom-table {
        width: 100%;
        height: auto;
        display: grid;
        margin-top: 5px;
        grid-template-columns: 50px 1fr;

        >.text {
          width: 100%;
          text-align: left;
        }
      }
    }
  }
}
</style>