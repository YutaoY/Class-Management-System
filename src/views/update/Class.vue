<template>
  <div class="page-content">
    <el-card style="width: 100%;" shadow="never">
      <template #header>
        <el-text>修改班级信息&nbsp;&nbsp;</el-text>
      </template>
      <el-form :model="classFormInfo" label-width="auto" ref="ruleFormRef" status-icon :rules="rules"
        style="max-width: 600px;">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="classFormInfo.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="辅导员" prop="counselor">
          <el-input v-model.trim="classFormInfo.counselor" placeholder="请输入辅导员姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="tel">
          <el-input v-model.trim="classFormInfo.tel" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="学院" prop="school">
          <el-input v-model.trim="classFormInfo.school" placeholder="输入学院名称" />
        </el-form-item>
        <el-form-item label="二级学院" prop="subsidiary">
          <el-input v-model.trim="classFormInfo.subsidiary" placeholder="输入二级学院名称" />
        </el-form-item>
        <el-form-item label="作业负责人">
          <el-autocomplete v-model="xwname" :fetch-suggestions="queryClass" placeholder="选择作业负责人"
            @select="handleXWSelect" @clear="classFormInfo.XW = ''" clearable>
            <template #default="{ item }">
              <div class="user" style="display: flex; align-items: center">
                <img class="avatar" :src="getAvatar(item.avatar)" />
                <div>
                  <el-text class="user-name" :type="item.sex === UserSex.MALE ? 'primary' : 'danger'">
                    {{ item.name }}
                  </el-text>
                </div>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="考勤负责人">
          <el-autocomplete v-model="jwname" :fetch-suggestions="queryClass" placeholder="选择考勤负责人"
            @select="handleJWSelect" @clear="classFormInfo.JW = ''" clearable>
            <template #default="{ item }">
              <div class="user" style="display: flex; align-items: center">
                <img class="avatar" :src="getAvatar(item.avatar)" />
                <div>
                  <el-text class="user-name" :type="item.sex === UserSex.MALE ? 'primary' : 'danger'">
                    {{ item.name }}
                  </el-text>
                </div>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="状态" v-if="userStore.getIsAdmin">
          <el-select v-model="classBaseInfo.state" placeholder="请选择状态">
            <el-option v-for="item in stateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm(ruleFormRef)">确认修改</el-button>
          <el-button @click="resetClassInfo">重置</el-button>
          <el-button @click="backPage">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang='ts'>
import { ref, reactive } from 'vue'
import { ClassInfo, ClassRegister, UserInfo } from "@/types/store"
import { validateTel } from '@/utils/form'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ClassRequest } from '@/api/classApi'
import { ApiStatus } from '@/utils/http/status'
import { useUserStore } from "@/store/modules/user"
import { router } from "@/router"
import { emitter } from '@/utils/event'
import { ClassDefualt } from '@/api/model/classParams'
import { useClassStore } from '@/store/modules/class'
import { getAvatar } from '@/utils/avatar'
import { UserSex } from '@/enums/appEnum'
import { userData } from '@/utils/data'

const routerData = useRoute();
const classId = ref<string>('');
const userStore = useUserStore();
const classStore = useClassStore();
const ruleFormRef = ref<FormInstance>();
const classBaseInfo = ref<Partial<ClassInfo>>({});
const classFormInfo = ref<Partial<ClassDefualt>>({});
const rules = reactive<FormRules<ClassRegister>>({
  tel: [{ validator: validateTel, trigger: 'blur' }],
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' },],
  school: [{ required: true, message: '请输入学院名称', trigger: 'blur' }],
  counselor: [{ required: true, message: '请输入辅导员姓名', trigger: 'blur' }],
})
const stateOptions = [
  { value: 0, label: '异常' },
  { value: 1, label: '正常' },
]

const xwname = computed(()=>{
  return classFormInfo.value.XW ? userData.value.use(classFormInfo.value.XW).name : ''
})

const jwname = computed(()=>{
  return classFormInfo.value.JW ? userData.value.use(classFormInfo.value.JW).name : ''
})

const handleXWSelect = (item: Record<string, any>) => {
  classFormInfo.value.XW = item.id;
}

const handleJWSelect = (item: Record<string, any>) => {
  classFormInfo.value.JW = item.id;
}

const resetClassInfo = () => {
  classId.value = String(routerData.query.id);
  classBaseInfo.value = JSON.parse(routerData.query.data as string);
  classFormInfo.value = JSON.parse(routerData.query.data as string);
}

const queryClass = (queryString: string, cb: (arg: any) => void) => {
  const results = queryString
    ? classStore.getClassList.filter(createFilter(queryString))
    : classStore.getClassList
  cb(results)
}

const createFilter = (queryString: string) => {
  return (restaurant: UserInfo) => {
    return (
      restaurant.name.toLowerCase().indexOf(queryString.toLowerCase()) !== -1
    )
  }
}

onMounted(() => {
  resetClassInfo();
})

const backPage = () => {
  router.replace("/class/list");
}
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      const res = await ClassRequest.update(classFormInfo.value, classId.value);
      if (res.err === ApiStatus.success) {
        ElMessage.success("修改成功");
        emitter.emit('updateClassList');
        backPage();
      } else ElMessage.error(res.result);
    }
  })
}
</script>

<style lang="scss" scoped>
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
}

.user {
  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }

  >div {
    margin-left: 5px;

    .user-name {
      font-weight: 500;
    }
  }
}
</style>