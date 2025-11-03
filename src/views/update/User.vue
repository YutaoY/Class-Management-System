<template>
  <div class="page-content">
    <el-card style="width: 100%;" shadow="never">
      <template #header>
        <el-text>修改用户信息&nbsp;&nbsp;</el-text>
      </template>
      <el-form :model="userFormInfo" label-width="auto" ref="ruleFormRef" status-icon :rules="rules"
        style="max-width: 600px;">
        <el-form-item label="姓名" prop="name">
          <el-input v-model.trim="userFormInfo.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" required>
          <el-select v-model="userFormInfo.sex" placeholder="请选择性别">
            <el-option v-for="item in sexOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="职务">
          <el-input v-model.trim="userFormInfo.position" placeholder="输入职务" />
        </el-form-item>
        <el-form-item label="班级" v-if="userStore.getIsAdmin">
          <el-select v-model="userFormInfo.class" remote :loading="!isGetClass">
            <el-option v-for="item in classGetAll" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限">
          <el-select v-model="userFormInfo.power" placeholder="请选择权限">
            <el-option v-for="item in powerOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required v-if="!(userFormInfo.id === userInfo.id && userStore.getIsAdmin)">
          <el-select v-model="userFormInfo.state" placeholder="请选择状态">
            <el-option v-for="item in stateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm(ruleFormRef)">确认修改</el-button>
          <el-button @click="resetUserInfo">重置</el-button>
          <el-button @click="backPage">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang='ts'>
import { ref, reactive } from 'vue'
import { PowerType } from "@/enums/appEnum"
import { UserRegister, ClassInfo, UserInfo } from "@/types/store"
import { validateTel } from '@/utils/form'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ClassRequest } from '@/api/classApi'
import { ApiStatus } from '@/utils/http/status'
import { useUserStore } from "@/store/modules/user"
import { router } from "@/router"
import { UserRequest } from '@/api/usersApi'
import { emitter } from '@/utils/event'
import { sexOptions } from '@/utils/options'

const routerData = useRoute();
const isGetClass = ref(false);
const userId = ref<string>('');
const ruleFormRef = ref<FormInstance>();
const classGetAll = ref<ClassInfo[]>([]);
const userStore = useUserStore();
const userInfo = userStore.getUserInfo;
const userBaseInfo = ref<Partial<UserInfo>>({});
const userFormInfo = ref<Partial<UserInfo>>({});
const rules = reactive<FormRules<UserRegister>>({
  tel: [{ validator: validateTel, trigger: 'blur' }],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 1, max: 10, message: '姓名长度应在1-10个字符', trigger: 'blur' },
  ]
})
const powerOptions = [
  { value: -1, label: '无' },
  { value: 0, label: '学生' },
  { value: 1, label: '班委' },
  // { value: 2, label: '教师' },
  { value: 3, label: '管理员' }
]

const stateOptions = [
  { value: 0, label: '异常' },
  { value: 1, label: '正常' },
]

const resetUserInfo = () => {
  userId.value = String(routerData.query.id);
  userBaseInfo.value = JSON.parse(routerData.query.data as string);
  userFormInfo.value = JSON.parse(routerData.query.data as string);
}

onMounted(async () => {
  await getClassList();
  isGetClass.value = true;
  resetUserInfo();
})
const getClassList = async () => {
  if (userInfo.power && userInfo.power > PowerType.COMMITTEE) {
    if (classGetAll.value.length === 0) {
      const res = await ClassRequest.getAll();
      if (res.err === ApiStatus.success) {
        classGetAll.value = res.result;
      } else ElMessage.error(res.result);
    }
  }
}
const backPage = () => {
  router.replace("/user/account");
}
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  if (userFormInfo.value.id === userInfo.id && userStore.getIsAdmin && userFormInfo.value.state === 0)
    return ElMessage.error("您不能将您的状态设置为异常");
  await formEl.validate(async (valid) => {
    if (valid) {
      const res = await UserRequest.update(userFormInfo.value, PowerType.ADMIN);
      if (res.err === ApiStatus.success) {
        ElMessage.success("修改成功");
        emitter.emit('updateUserList');
        if (userId.value === userInfo.id)
          location.reload()
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
</style>