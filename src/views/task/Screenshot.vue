<template>
  <div class="page-screenshot">
    <div class="page-header">
      <h2>考勤汇总<br />{{ classInfo.name }}</h2>
      <p>
        {{ dayjs(shareAttendanceList[0].date).format("YYYY年MM月DD日") }}
        -
        {{ dayjs(shareAttendanceList[shareAttendanceList.length - 1].date).format("YYYY年MM月DD日") }}
      </p>
    </div>
    <div class="page-center">
      <div class="page-list" v-if="shareAttendanceList.length">
        <el-space direction="vertical" fill style="width: 100%;">
          <div class="list-item-box" v-for="item in shareAttendanceList" :key="item.date">
            <div class="item-header">
              <div class="padding">
                <el-space wrap :size="20" style="width: 100%;">
                  <span class="date">{{ dayjs(item.date).format("YYYY年MM月DD日") }}</span>
                  <div class="tag-box">
                    <el-space wrap style="width: 100%;">
                      <span class="day">{{ getWeekdayFromTimestamp(item.date) }}</span>
                      <span class="week">第{{ item.attendance[0].week }}周</span>
                    </el-space>
                  </div>
                </el-space>
              </div>
            </div>
            <div class="kc-list">
              <el-space direction="vertical" fill style="width: 100%;">
                <template v-for="taskitem in item.attendance">
                  <div class="card-content">
                    <div class="task-header">
                      <h2 class="task-title">{{ taskitem.title }}</h2>
                      <div class="publisher">
                        <i class="fas fa-user-circle"></i>
                        <span>创建: {{ userData.use(taskitem.user).name }}</span>
                        <i class="fa fa-institution"></i>
                        <span v-if="taskitem.lock && classInfo.JW">
                          终审: {{ userData.use(classInfo.JW).name }}
                        </span>
                      </div>
                    </div>

                    <div class="time-info">
                      <i class="far fa-clock"></i>
                      <span>{{ dayjs(Number(taskitem.start)).format("YYYY年MM月DD日 HH:mm") }}</span>
                    </div>

                    <div class="summary-section">
                      <div class="summary-item present">
                        <div class="summary-value">
                          {{ getAttendanceYD(taskitem).length }}&nbsp;/&nbsp;{{ taskitem.list.check.length }}</div>
                        <div class="summary-label">实到&nbsp;/&nbsp;应到</div>
                      </div>
                    </div>

                    <div class="members-section" v-if="getAttendanceQJ(taskitem).length">
                      <div class="section-header">
                        <div class="section-title">
                          <i class="fas fa-file-medical" style="color: #dd6b20;"></i>
                          <span>请假人员</span>
                        </div>
                        <span class="count-badge leave-badge">
                          {{ getAttendanceQJ(taskitem).length }}人
                        </span>
                      </div>
                      <MemberTag :list="getAttendanceQJ(taskitem)" />
                    </div>

                    <div class="members-section" v-if="getAttendanceWJ(taskitem).length">
                      <div class="section-header">
                        <div class="section-title">
                          <i class="fas fa-user-slash" style="color: #e53e3e;"></i>
                          <span>旷课人员</span>
                        </div>
                        <span class="count-badge absent-badge">
                          {{ getAttendanceWJ(taskitem).length }}人
                        </span>
                      </div>
                      <MemberTag :list="getAttendanceWJ(taskitem)" />
                    </div>

                    <div class="members-section" v-if="getAttendanceZT(taskitem).length">
                      <div class="section-header">
                        <div class="section-title">
                          <i class="fas fa-running" style="color: #3182ce;"></i>
                          <span>早退人员</span>
                        </div>
                        <span class="count-badge early-badge">
                          {{ getAttendanceZT(taskitem).length }}人
                        </span>
                      </div>
                      <MemberTag :list="getAttendanceZT(taskitem)" />
                    </div>
                  </div>
                </template>
              </el-space>
            </div>
          </div>
        </el-space>
        <el-result title="班级管理系统">
          <template #sub-title>
            <el-space direction="vertical">
              <el-text type="info">
                江西新能源科技职业学院
              </el-text>
              <el-text type="info">
                24软件技术一班
              </el-text>
              <el-text type="info">
                技术部 出品
              </el-text>
              <br>
              <el-text type="primary">
                详细考勤数据请扫描上方二维码查看哦~
              </el-text>
            </el-space>
          </template>
          <template #icon>
            <vue-qr :text="shareURL" :size="100"></vue-qr>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import MemberTag from '@/views/task/widgets/MemberTag.vue'
import { AttendanceEnum } from '@/enums/classEnum';
import { useClassStore } from '@/store/modules/class';
import { TaskInfo } from '@/types/store';
import { userData } from '@/utils/data';
import { dayjs } from 'element-plus';
import vueQr from 'vue-qr/src/packages/vue-qr.vue';
import { shareAttendanceList } from '@/utils/share';

const shareURL = location.href
const classInfo = computed(() => useClassStore().getClassInfo)

const getWeekdayFromTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[date.getDay()];
}

const getAttendanceYD = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.YD || item.state === AttendanceEnum.CD)
}

const getAttendanceQJ = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.SJ || item.state === AttendanceEnum.BJ)
}

const getAttendanceWJ = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.WD || item.state === AttendanceEnum.KK)
}

const getAttendanceZT = (item: TaskInfo) => {
  const list = item.list.check
  return list.filter(item => item.state === AttendanceEnum.ZT)
}

</script>

<style lang="scss" scoped>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");

.page-screenshot {
  width: 100%;
  height: 100%;
  background-color: #f4f6f9;

  .page-header {
    width: 100%;
    padding: 1em 0;
    text-align: center;
    line-height: 50px;

    p {
      color: #999;
    }
  }

  .page-center {
    width: 100%;
    height: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;

    .page-list {
      width: 100%;
      height: auto;

      .list-item-box {
        width: 100%;
        height: auto;
        overflow: hidden;
        padding-bottom: 1em;
        border-radius: 10px;
        background-color: #fff;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);

        .item-header {
          width: 100%;
          color: #fff;
          background-color: #000;
          overflow: hidden;
          padding: 1em 0;
          display: flex;
          justify-content: center;

          .padding {
            width: 90%;
          }

          .date {
            font-size: 20px;
            font-weight: bold;
          }

          .tag-box {
            width: 100%;

            span {
              text-align: center;
              padding: 5px 15px;
              border-radius: 30px;
              background-color: #667eea;
              color: #fff;
            }
          }
        }

        .kc-list {
          width: 100%;
          height: auto;
          background-color: #fff;
        }

        .card-header {
          background: #4a5568;
          color: white;
          padding: 18px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .date-info {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .date-text {
          font-size: 1.3rem;
          font-weight: 500;
        }

        .week-badge {
          background: #667eea;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.9rem;
        }

        .detail-link {
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.95rem;
        }

        .card-content {
          padding: 25px;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .task-title {
          font-size: 1.4rem;
          color: #2d3748;
          font-weight: 600;
        }

        .publisher {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #718096;
          font-size: 0.95rem;
        }

        .publisher i {
          color: #ecc94b;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #718096;
          margin-bottom: 20px;
          padding: 12px 15px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .summary-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .summary-item {
          text-align: center;
          flex: 1;
        }

        .summary-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .summary-label {
          color: #718096;
          font-size: 0.9rem;
        }

        .present .summary-value {
          color: #38a169;
        }

        .members-section {
          margin-top: 20px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.1rem;
          color: #2d3748;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .count-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .present-badge {
          background: #c6f6d5;
          color: #22543d;
        }

        .absent-badge {
          background: #fed7d7;
          color: #742a2a;
        }

        .leave-badge {
          background: #feebcb;
          color: #744210;
        }

        .early-badge {
          background: #bee3f8;
          color: #2a4365;
        }

        .members-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .member-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #f7fafc;
          border-radius: 20px;
          font-size: 0.9rem;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }
      }
    }
  }
}
</style>