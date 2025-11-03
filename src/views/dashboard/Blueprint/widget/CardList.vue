<template>
  <ul class="card" :style="{ marginTop: showWorkTab ? '0' : '10px' }">
    <li class="console-box-2" v-for="(item, index) in dataList" :key="index" :style="dataListStyle">
      <span class="des">{{ item.des }}</span>
      <div>
        <div :style="`max-width: ${item.change ? '40' : '80'}%;`">
          <el-text truncated class="number">{{ item.content }}</el-text>
        </div>
        <div style="max-width: 50%;">
          <el-text truncated class="change">{{ item.change }}</el-text>
        </div>
      </div>
      <i class="iconfont" :style="{ backgroundImage: `${item.color} !important` }">{{
        item.icon
      }}</i>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useClassStore } from '@/store/modules/class';
import { useSettingStore } from '@/store/modules/setting'
import dayjs from 'dayjs';

const classStore = useClassStore()
const settingStore = useSettingStore()
const classInfo = computed(() => classStore.getClassInfo)
const classList = computed(() => classStore.getClassList)
const showWorkTab = computed(() => settingStore.showWorkTab)

const dataList = [
  {
    des: '班级名称',
    icon: '\ue6c5',
    change: '',
    content: classInfo.value.name,
    color: 'linear-gradient(310deg,#50D0FF,#50A3FF)'
  },
  {
    des: '班级人数',
    icon: '\ue80a',
    content: `${classList.value.length}人`,
    change: `@${classInfo.value.subsidiary}`,
    color: 'linear-gradient(310deg,#61E7CC,#61D7E7)'
  },
  {
    des: '辅导员',
    icon: '\ue7b8',
    content: classInfo.value.counselor,
    change: classInfo.value.tel,
    color: 'linear-gradient(310deg,#5e72e4,#825ee4)'
  },
  {
    des: '院校名称',
    icon: '\ue666',
    content: classInfo.value.school,
    change: '',
    color: 'linear-gradient(310deg,#f5365c,#f56036)'
  }
]
let dataListStyle = {}

onMounted(() => {
  computedItemWidth()
})

const computedItemWidth = () => {
  let count = dataList.length
  let width = 100 / count
  dataListStyle = {
    width: `calc(${width}% - 20px)`
  }
}
</script>

<style lang="scss" scoped>
.card {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  width: calc(100% + var(--console-margin));
  margin-left: calc(0px - var(--console-margin));
  background-color: transparent !important;

  li {
    position: relative;
    box-sizing: border-box;
    width: calc(25% - var(--console-margin));
    height: 90px;
    padding: 0 18px;
    margin: 0 0 0 var(--console-margin);
    background: var(--art-main-bg-color);
    border-radius: 14px;
    // box-shadow: 0 5px 27px rgb(0 0 0 / 5%);

    $icon-size: 46px;

    .iconfont {
      position: absolute;
      top: 0;
      right: 15px;
      bottom: 0;
      width: $icon-size;
      height: $icon-size;
      margin: auto;
      overflow: hidden;
      font-size: 20px;
      line-height: $icon-size;
      color: #fff !important;
      text-align: center;
      background-color: #2c90ff;
      border-radius: 12px;
    }

    .des {
      display: block;
      height: 14px;
      margin-top: 20px;
      font-size: 13px;
      font-weight: 500;
      line-height: 14px;
    }

    >div {
      display: flex;
      align-items: center;

      .number {
        display: block;
        margin-top: 10px;
        font-size: 20px;
        font-weight: 400;
        color: var(--art-text-gray-800);
      }

      .change {
        display: block;
        margin: 13px 0 0 10px;
        font-size: 13px;
        font-weight: bold;
      }
    }
  }
}
</style>
