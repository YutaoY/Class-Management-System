<template>
  <div class="add-class">
    <el-card style="width: 100%;" shadow="never">
      <el-form :model="form" label-width="auto" ref="ruleFormRef" status-icon :rules="rules">
        <el-form-item label="学校" prop="school">
          <el-input v-model.trim="form.school" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="学院" prop="subsidiary">
          <el-input v-model.trim="form.subsidiary" placeholder="输入二级学院名称" />
        </el-form-item>
        <el-form-item label="班级" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="辅导员" prop="counselor">
          <el-input v-model.trim="form.counselor" placeholder="请输入辅导员姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="tel">
          <el-input v-model.trim="form.tel" placeholder="请输入辅导员手机号" />
        </el-form-item>
      </el-form>
      <el-button type="warning" :loading="loading" @click="submitForm(ruleFormRef)">超级管理员权限添加</el-button>
      <el-button @click="resetForm(ruleFormRef)">清空&nbsp;/&nbsp;重置</el-button>
    </el-card>
  </div>
</template>

<script setup lang='ts'>
import { reactive } from 'vue'
import { ClassRequest } from "@/api/classApi"
import { ClassRegister } from "@/types/store"
import { validateTel, resetForm } from '@/utils/form'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ApiStatus } from '@/utils/http/status'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const isLogin = computed(() => useUserStore().isLogin)

const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const rules = reactive<FormRules<ClassRegister>>({
  tel: [{ required: true, validator: validateTel, trigger: 'blur' }],
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  school: [{ required: true, message: '请输入学校名称', trigger: 'blur' }],
  counselor: [{ required: true, message: '请输入辅导员姓名', trigger: 'blur' }]
})

const form = reactive<ClassRegister>({
  tel: '',
  name: '',
  school: '',
  counselor: '',
  subsidiary: ''
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!userStore.getIsAdmin)
    return ElMessage.error('权限不足')

  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) ElMessageBox.confirm(
      `请确保填入的信息正确，是否确认添加 ${form.name} ?`,
      '二次确认！',
      {
        confirmButtonText: '管理员已确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        if (isLogin) addClassSend();
      })
  })
}

const addClassSend = async () => {
  loading.value = true;
  try {
    const res = await ClassRequest.add({ ...form });
    if (res.err === ApiStatus.success) {
      resetForm(ruleFormRef.value);
      ElMessageBox.alert('班级添加成功', '操作成功', {
        confirmButtonText: '知道了',
        callback: () => {
          location.reload()
        },
      })
    } else ElMessage.error(res.result)
  } finally {
    loading.value = false // 无论成功还是失败，都停止加载
  }
}
</script>

<style lang="scss" scoped>
.add-class {
  width: 99%;
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