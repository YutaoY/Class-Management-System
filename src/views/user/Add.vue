<template>
  <div class="add-user">
    <el-card style="width: 100%;" shadow="never">
      <template #header>
        <el-text type="info">添加的数据将暂存至待提交列表</el-text>
      </template>
      <el-form :model="form" label-width="auto" ref="ruleFormRef" status-icon :rules="rules" style="max-width: 800px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" required>
          <el-select v-model="form.sex" placeholder="请选择性别">
            <el-option label="男" :value="UserSex.MALE" />
            <el-option label="女" :value="UserSex.FEMALE" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model.trim="form.password" placeholder="请输入密码, 长度在8-20个字符" show-password
            clearable />
        </el-form-item>
        <el-form-item label="职务">
          <el-input v-model.trim="form.position" placeholder="输入职务" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetForm(ruleFormRef)">清空</el-button>
          <el-button type="primary" @click="submitForm(ruleFormRef)">添加</el-button>
          <el-button color="#109968" @click="dialogVisible = true" :icon="DocumentChecked">
            表格导入
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <template v-if="userFromList.length > 0">
      <el-divider>
        <el-text type="primary">待提交数据</el-text>
      </el-divider>
      <el-card style="width: 100%" shadow="never">
        <template #header>
          <div>
            <div>
              <el-text size="large">&nbsp;将账号注册到</el-text>&nbsp;
              <el-select v-model="classID" style="width: 240px" v-if="userStore.getIsAdmin">
                <el-option v-for="item in classGetAll" :label="item.name" :value="item.id" />
              </el-select>
              <el-text v-else>{{ classStore.getClassInfo.name }}</el-text>
            </div>
            <br>
            <div>
              <el-button text bg @click="deleteList">清空列表</el-button>
              <el-button type="primary" @click="submitList" :icon="Upload">提交注册</el-button>
            </div>
          </div>
        </template>
        <el-table :data="userFromList" stripe style="width: 100%">
          <el-table-column label="姓名">
            <template #default="scope">
              <el-text :type="scope.row.sex == UserSex.MALE ? 'primary' : 'danger'">
                {{ scope.row.name }}
              </el-text>
            </template>
          </el-table-column>
          <el-table-column prop="position" label="职位" width="125px">
            <template #default="scope">
              <el-input v-model="scope.row.position" style="width: 100%" placeholder="输入职位" />
            </template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="scope">
              <el-text v-if="scope.row.result" :type="scope.row.result ? 'success' : 'danger'">
                {{ scope.row.result ? '注册成功' : '注册失败' }}
              </el-text>
              <el-text v-else>待提交</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="position" label="职位" width="125px">
            <template #default="scope">
              <el-button link type="warning" @click="cancelItem(scope.$index)">取消注册</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
    <el-dialog v-model="dialogVisible" title="表格导入模板" width="666">
      <el-alert title="表格第一行需有以下字段（不得有空格等特殊符号类），系统将自行解析数据！" type="warning" effect="dark" :closable="false" />
      <el-table :data="gridData">
        <el-table-column property="name" label="姓名" />
        <el-table-column property="sex" label="性别" />
        <el-table-column property="id" label="身份证号" />
        <el-table-column property="address" label="住址" />
      </el-table>
      <br><br><br>
      <div style="display: flex;justify-content: center;">
        <el-button type="success" @click="addClassList">选择表格文件</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang='ts'>
import { Md5 } from "ts-md5"
import { ref, reactive } from 'vue'
import { UserSex } from "@/enums/appEnum"
import { UserRegister, ClassInfo } from "@/types/store"
import { validateTel, resetForm } from '@/utils/form'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Upload, DocumentChecked } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ClassRequest } from '@/api/classApi'
import { ApiStatus } from '@/utils/http/status'
import { UserRequest } from '@/api/usersApi'
import { addClassList } from "@/utils/addUserList"
import { emitter } from "@/utils/event"
import { useUserStore } from "@/store/modules/user"
import { useClassStore } from "@/store/modules/class"

const userStore = useUserStore();
const classStore = useClassStore();

const isLoadSend = ref(false);
const dialogVisible = ref(false);
const ruleFormRef = ref<FormInstance>();
const classGetAll = ref<ClassInfo[]>([]);
const userFromList = ref<UserRegister[]>([]);
const rules = reactive<FormRules<UserRegister>>({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 1, max: 10, message: '姓名长度应在1-10个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度应在8-20个字符', trigger: 'blur' },
  ]
})

const gridData = [{
  id: '用作登录的密码',
  sex: '性别',
  name: '姓名',
  address: '住址（可选）',
}]

const classID = ref<string>(userStore.getIsAdmin ? '' : (userStore.getUserInfo.class as string));
const form = reactive<UserRegister>({
  name: '',
  sex: UserSex.MALE,
  position: '',
  address: '',
  password: ''
})
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      userFromList.value.push(Object.assign({}, form));
      userFromList.value[userFromList.value.length - 1].password = new Md5().appendAsciiStr(userFromList.value[userFromList.value.length - 1].password).end() as string

      ElMessage({
        message: '添加成功',
        type: 'success',
      })
    }
  })
}

watch(userFromList.value, async () => {
  if (userFromList.value.length > 0)
    if (classGetAll.value.length === 0) {
      const res = await ClassRequest.getAll();
      if (res.err === ApiStatus.success) {
        classGetAll.value = res.result;
      } else ElMessage.error(res.result);
    }
})

const cancelItem = (index: number) => {
  ElMessageBox.confirm(
    `确认取消注册 ${userFromList.value[index].name}？`,
    '操作警告！',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      appendTo: document.body
    }
  )
    .then(() => {
      userFromList.value.splice(index, 1);
    })
}

const deleteList = () => {
  ElMessageBox.confirm(
    '确认删除添加列表里所有暂存的数据？',
    '操作警告！',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      appendTo: document.body
    }
  )
    .then(() => {
      userFromList.value = [];
      ElMessage({
        type: 'success',
        message: '操作成功：已删除所有数据',
      })
    })
}

const submitList = async () => {
  if (classID.value) {
    ElMessageBox.confirm(
      '确认提交所有暂存数据？',
      '操作确认！',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      sendData(0);
    })
  } else ElMessage.warning('请先选择班级编号');
}

const errConls = (err: string, index: number) => {
  isLoadSend.value = false;
  userFromList.value[index].result = false;
  ElNotification({
    title: '提交失败',
    message: `${userFromList.value[index].name}：${err}`,
    type: 'error',
  })
}

const sendData = async (index: number) => {
  if (!isLoadSend.value) {
    isLoadSend.value = true;
    const item = userFromList.value[index];
    try {
      const res = await UserRequest.add({ ...item, classid: classID.value });
      if (res.err === ApiStatus.success) {
        isLoadSend.value = false;
        userFromList.value[index].result = true;
        ElNotification({
          title: '提交成功',
          message: `${item.name}注册成功！`,
          type: 'success',
          duration: 2500,
        })
        if (userFromList.value[index + 1])
          sendData(index + 1);
      }
      else errConls(res.result, index);
    }
    catch (error) {
      errConls("提交时出现未知错误!", index);
    }
  }
}

emitter.on('addfile', (list: UserRegister[]) => {
  dialogVisible.value = false;
  list.forEach((item, index) => {
    const addList = ref<UserRegister>({
      name: '',
      sex: UserSex.MALE,
      position: '',
      address: '',
      password: ''
    })
    if ("姓名" in item) addList.value.name = item["姓名"] as string;
    else return ElMessage.error("缺少姓名!");

    if ("性别" in item) addList.value.sex = item["性别"] === "男" ? UserSex.MALE : UserSex.FEMALE;
    else return ElMessage.error("缺少性别!");

    if ("身份证号" in item)
      addList.value.password = new Md5().appendAsciiStr(item["身份证号"] as string).end() as string;
    else return ElMessage.error("缺少身份证号!");

    if ("住址" in item) addList.value.address = item["住址"] as string;
    if ("职位" in item) addList.value.position = item["职位"] as string;

    userFromList.value.push(addList.value);

    if (index === list.length - 1) ElMessage.success("导入成功，已添加至待提交列表！");
  })
})
</script>

<style lang="scss" scoped>
.add-user {
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