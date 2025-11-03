<template>
  <div class="page-content">
    <el-row :gutter="12" v-if="userInfo?.power && userInfo?.power > PowerType.ORDINARY">
      <!-- <el-col :xs="24" :sm="12" :lg="8">
        <el-input placeholder="课程名称"></el-input>
      </el-col> -->
      <el-col :xs="24" :sm="12" :lg="8" class="el-col2">
        <!-- <el-button>搜索</el-button> -->
        <el-button type="primary"
          @click="AddKCB">新增课表</el-button>
      </el-col>
    </el-row><br>
    <el-collapse v-model="semester" accordion v-if="kcbList.length && kcbList.length > 0">
      <el-collapse-item v-for="(item, index) in kcbList" :name="index" :key="index">
        <template #title>
          <el-space wrap :size="10">
            <el-tag type="primary" effect="dark" round>{{ index + 1 }}</el-tag>

            <el-tag type="warning" v-if="index === 0">当前学期</el-tag>

            <el-button link :icon="EditPen" type="primary" v-if="editIndex != index && getEditPower"
              @click.stop="EditKCB(index)"></el-button>
            <el-button link :icon="Select" type="success" v-if="editIndex == index && getEditPower"
              @click.stop="EditKCB(index)"></el-button>
            <template v-if="editIndex == index">
              <el-date-picker v-model="item.first" type="date" placeholder="选择开学第一周日期" @change="setDateFormat(item.first, index)" />
            </template>
            <el-text v-else>{{ dayjs(item.first).format("YYYY年MM月DD日") }}</el-text>

            <el-button link :icon="Plus" type="success" v-if="getEditPower && semester === index"
              @click.stop="AddKCBList">新增课程</el-button>

            <el-button link :icon="Delete" type="danger" v-if="getEditPower && semester === index"
              @click.stop="DeleKCB">删除</el-button>
          </el-space>
        </template>
        <el-table :data="item.list" style="width: 100%">
          <el-table-column prop="name" label="课程名" width="180" />
          <el-table-column prop="teacher" label="教师" width="180" />
          <el-table-column prop="address" label="上课地址" />
          <el-table-column fixed="right" label="操作" v-if="userInfo?.power === PowerType.ADMIN">
            <template #default="scope">
              <el-button link :icon="EditPen" type="primary" @click="EditKCBList(scope.$index)">
                编辑
              </el-button>
              <el-popconfirm title="确认删除该课程？" placement="top" @confirm.stop="DeleKCBList(scope.$index)">
                <template #reference>
                  <el-button link :icon="Delete" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
    <el-empty :image="emptypng" :image-size="250" description="课程表为空呢~" v-else />

    <el-dialog v-model="isAddKCBList" width="400" align-center destroy-on-close
      :title="editType == KCBModeEnum.Add ? '新增课程' : '编辑课程'">
      <el-form ref="ruleFormRef" style="width: 100%;" :model="formKCBList" :rules="rulesKCBList" label-width="auto">
        <el-form-item label="课程名" prop="name">
          <el-input v-model="formKCBList.name" />
        </el-form-item>
        <el-form-item label="授课教师" prop="teacher">
          <el-input v-model="formKCBList.teacher" />
        </el-form-item>
        <el-form-item label="上课地址" prop="address">
          <el-input v-model="formKCBList.address" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm(ruleFormRef)">
          {{ editType == KCBModeEnum.Add ? "新增" : "保存" }}
        </el-button>
        <el-button @click="resetForm(ruleFormRef)">清空</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/store/modules/user";
import { useClassStore } from "@/store/modules/class";
import { PowerType } from "@/enums/appEnum";
import { KCBListType, KCBType } from "@/types/store";
import { EditPen, Delete, Plus, Select } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from "dayjs";
import { ClassRequest } from "@/api/classApi";
import { ApiStatus } from "@/utils/http/status";
import emptypng from '@/assets/img/empty/empty.png'

enum KCBModeEnum {
  Add, // 新增
  Edit // 编辑
}

const semester = ref(0)
const editIndex = ref(-1)
const loading = ref(false)
const editListIndex = ref(-1)
const isAddKCBList = ref(false)
const userStore = useUserStore()
const classStore = useClassStore()
const kcbList = ref<KCBType[]>([])
const editType = ref<KCBModeEnum>(KCBModeEnum.Add)
const userInfo = computed(() => userStore.getUserInfo)
const classInfo = computed(() => classStore.getClassInfo)

const ruleFormRef = ref<FormInstance>()
const validateName = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('课程名不能为空'))
  } else {
    if (formKCBList.value.name !== '') {
      if (!ruleFormRef.value) return
      if (kcbList.value[semester.value].list.filter(item => item.name === value).length > 0){
        if(editType.value === KCBModeEnum.Add){
          callback(new Error('课程名重复！'))
        }
      }
      ruleFormRef.value.validateField('checkPass')
    }
    callback()
  }
}

const rulesKCBList = reactive<FormRules<KCBListType>>({
  name: [{ validator: validateName, required: true, trigger: 'blur' }],
})
const formKCBList = ref<KCBListType>({
  name: "",
  teacher: "",
  address: ""
})

const setDateFormat = (date: string, index: number) => {
  kcbList.value[index].first = new Date(new Date(date).setHours(0, 0, 0)).toString()
  console.log(kcbList.value[index].first)
}

onMounted(() => {
  if (classInfo.value.KCB) {
    kcbList.value = classInfo.value.KCB
  }
  nextTick(() => {
    loading.value = true
  })
})

watch(() => kcbList.value, async () => {
  if (!loading.value) return;
  if (!kcbList.value) return;
  if (!getEditPower.value) return;
  const res = await ClassRequest.update({ ...classInfo.value, KCB: JSON.stringify(kcbList.value) }, classInfo.value.id as string);
  if (res.err === ApiStatus.success) {
  } else ElMessage.error(res.result);
}, {
  deep: true
})

const getEditPower = computed(() => {
  if (userInfo.value?.power && userInfo.value?.power > PowerType.ORDINARY)
    return true
  return false
})

const AddKCB = () => {
  kcbList.value.unshift({
    first: new Date().toString(),
    list: []
  })
}

const EditKCB = (index: number) => {
  if (editIndex.value == index)
    editIndex.value = -1
  else editIndex.value = index
  if (editIndex.value == index) {
    setDateFormat(kcbList.value[index].first, index)
  }
}

const DeleKCB = () => {
  ElMessageBox.confirm(
    `是否删除该学期的课程表？`,
    '删除操作提醒', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    kcbList.value.splice(semester.value, 1)
  })
}

const AddKCBList = () => {
  isAddKCBList.value = true
  editType.value = KCBModeEnum.Add
  formKCBList.value = {
    name: "",
    teacher: "",
    address: ""
  }
}

const EditKCBList = (index: number) => {
  isAddKCBList.value = true
  editListIndex.value = index
  editType.value = KCBModeEnum.Edit
  formKCBList.value = kcbList.value[semester.value].list[editListIndex.value]
}

const DeleKCBList = (index: number) => {
  kcbList.value[semester.value].list.splice(index, 1)
}

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (editType.value == KCBModeEnum.Add)
        kcbList.value[semester.value].list.push(formKCBList.value)
      if (editType.value == KCBModeEnum.Edit)
        kcbList.value[semester.value].list[editListIndex.value] = formKCBList.value;
      isAddKCBList.value = false
    } else {
      console.log('error submit!', fields)
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

</script>

<style lang="scss" scoped>
.page-content {
  .svg-icon {
    width: 1.8em;
    height: 1.8em;
    overflow: hidden;
    vertical-align: -8px;
    fill: currentcolor;
  }

  .my-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 16px;
  }

  .user {
    .avatar {
      width: 25px;
      height: 25px;
      border-radius: 6px;
    }

    >div {
      margin-left: 5px;

      .user-name {
        font-weight: 500;
      }
    }
  }

  .class-add-dialog-body-box {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: auto;
    overflow-x: hidden;
  }
}
</style>
