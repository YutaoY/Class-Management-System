<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.jpg" />
          <el-avatar :size="80" class="avatar" :src="userInfo.avatar" @click="updateAvatar">
            <img :src="avatar" />
          </el-avatar>
          <h2 class="name">{{ userInfoForm.name }}</h2>
          <p class="des">{{ userInfoForm.blurb }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont">&#xe7fd;</i>
              <span>{{ userInfoForm.position || '学生' }}</span>
            </div>
            <div>
              <i class="iconfont">&#xe806;</i>
              <span>暂无</span>
            </div>
            <div>
              <i class="iconfont">&#xe63f;</i>
              <span>{{ userInfoForm.address }}</span>
            </div>
            <div>
              <i class="iconfont">&#xe7d9;</i>
              <span v-if="userInfo.power === PowerType.ADMIN && userInfo.class">
                班级 - 管理员
              </span>
              <span v-else-if="userInfo.power === PowerType.COMMITTEE && userInfo.class">
                班级 - 班委
              </span>
              <span v-else-if="userInfo.power === PowerType.ORDINARY && userInfo.class">
                班级 - 学生
              </span>
              <span v-else>无</span>
            </div>
          </div>
        </div>
      </div>
      <div class="right-wrap">
        <div class="info box-style">
          <h1 class="title">基本设置</h1>
          <el-form :model="userInfoForm" class="form" ref="userRuleFormRef" :rules="userInfoRules" label-width="86px"
            label-position="top">
            <el-row>
              <el-form-item label="姓名">
                <el-input v-model="userInfoForm.name" readonly />
              </el-form-item>
              <el-form-item label="性别" class="right-input">
                <el-select v-model="userInfoForm.sex">
                  <el-option label="男" :value="UserSex.MALE" disabled />
                  <el-option label="女" :value="UserSex.FEMALE" disabled />
                </el-select>
              </el-form-item>
            </el-row>

            <el-row>
              <el-form-item label="职位">
                <el-input v-model="userInfoForm.position" readonly />
              </el-form-item>
              <el-form-item label="邮箱" class="right-input">
                <el-input value="暂无" readonly />
              </el-form-item>
            </el-row>
            <el-row>
              <el-form-item label="地址" prop="address">
                <el-input v-model="userInfoForm.address" />
              </el-form-item>
            </el-row>

            <el-form-item label="个人介绍" prop="blurb" :style="{ height: '130px' }">
              <el-input type="textarea" :rows="4" v-model="userInfoForm.blurb" />
            </el-form-item>

            <div class="el-form-item-right">
              <el-button type="primary" style="width: 90px" @click="updateUser(userRuleFormRef)">修改</el-button>
            </div>
          </el-form>
        </div>

        <div class="info box-style" style="margin-top: 20px">
          <h1 class="title">更改密码</h1>
          <el-form :model="pwdForm" ref="pswdRuleFormRef" :rules="pswdInfoRules" class="form" label-width="86px"
            label-position="top">
            <el-form-item label="当前密码" prop="password">
              <el-input v-model="pwdForm.password" type="password" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" />
            </el-form-item>
            <div class="el-form-item-right">
              <el-button type="primary" style="width: 90px" @click="updatePswd(pswdRuleFormRef)">修改</el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    <el-dialog v-model="dialogAvatarVisible" title="更换头像" width="500" destroy-on-close>
      <el-result title="请确认头像效果" sub-title="请遵循头像规范，头像内容禁止含有违规违法信息！">
        <template #icon>
          <el-avatar :size="150" :src="chageUserAvatar" @error="errorHandler">
            <img :src="avatar" />
          </el-avatar>
        </template>
        <template #extra>
          <el-button type="primary" @click="dialogAvatarVisible = false">取消</el-button>
          <el-button type="success" @click="confirmChageAvatar">确认</el-button>
        </template>
      </el-result>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { UserRequest } from '@/api/usersApi';
import { PowerType, UserSex } from '@/enums/appEnum';
import { useClassStore } from '@/store/modules/class';
import { useUserStore } from '@/store/modules/user'
import { UserInfo } from '@/types/store';
import { validateTel } from '@/utils/form';
import { ApiStatus } from '@/utils/http/status';
import { ElLoading, ElMessage, FormInstance, FormRules } from 'element-plus'
import { Md5 } from 'ts-md5';
import avatar from "@/assets/img/avatar/avatar.jpg";

const userStore = useUserStore()
const classStore = useClassStore()
const userInfo = computed(() => userStore.getUserInfo)
const classInfo = computed(() => classStore.getClassInfo)

const dialogAvatarVisible = ref(false)
const centerDialogVisible = ref(true)
const chageUserAvatar = ref('')

const uploadfile = ref<File>()

onMounted(() => {
  userInfoForm.value = userInfo.value;
  userInfoForm.value.blurb = `${classInfo.value.school} ${classInfo.value.name}`
})

const date = ref('')

const userInfoForm = ref<Partial<UserInfo>>({});
const pwdForm = reactive({
  password: '',
  newPassword: '',
  confirmPassword: ''
})

const userRuleFormRef = ref<FormInstance>()
const userInfoRules = reactive<FormRules>({
  tel: [{ required: true, validator: validateTel, trigger: 'blur' }],
})
const pswdRuleFormRef = ref<FormInstance>()
const pswdInfoRules = reactive<FormRules>({
  password: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度应在8-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度应在8-20个字符', trigger: 'blur' },
  ],
})

onMounted(() => {
  getDate()
})
const getDate = () => {
  const d = new Date()
  const h = d.getHours()
  let text = ''

  if (h >= 6 && h < 9) {
    text = '早上好'
  } else if (h >= 9 && h < 11) {
    text = '上午好'
  } else if (h >= 11 && h < 13) {
    text = '中午好'
  } else if (h >= 13 && h < 18) {
    text = '下午好'
  } else if (h >= 18 && h < 24) {
    text = '晚上好'
  } else if (h >= 0 && h < 6) {
    text = '很晚了，早点睡'
  }
  date.value = text
}

const updateUser = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      const res = await UserRequest.update({
        address: userInfoForm.value.address,
        blurb: userInfoForm.value.blurb,
      }, PowerType.ORDINARY)
      if (res.err === ApiStatus.success) {
        ElMessage.success("信息修改成功！");
      } else ElMessage.error(res.result);
    }
    else ElMessage.error("字段校验未通过！");
  })
}

const updatePswd = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      if (pwdForm.newPassword === pwdForm.confirmPassword) {
        const res = await UserRequest.password({
          oldpaw: new Md5().appendAsciiStr(pwdForm.password).end() as string,
          newpaw: new Md5().appendAsciiStr(pwdForm.newPassword).end() as string
        })
        if (res.err === ApiStatus.success) {
          ElMessage.success("密码修改成功！");
          useUserStore().logOut();
          ElMessage.warning("请重新登录！");
        } else ElMessage.error(res.result);
      } else ElMessage.error("新密码两次输入不一致！");
    }
    else ElMessage.error("字段校验未通过！");
  })
}

const errorHandler = () => {
  chageUserAvatar.value = ''
  uploadfile.value = undefined;
  dialogAvatarVisible.value = false;
  ElMessage.error("头像加载失败，请重新选择！");
}

const updateAvatar = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.jpeg,.jpg';
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      const FileExt = file.name.split('.').pop() as string;
      if (['jpg'].indexOf(FileExt.toLowerCase()) === -1) {
        dialogAvatarVisible.value = false;
        return ElMessage.warning('请选择JPG图片文件！');
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
        if (reader.result) {
          chageUserAvatar.value = reader.result as string;
          dialogAvatarVisible.value = true;
          uploadfile.value = file;
        } else {
          dialogAvatarVisible.value = false;
          ElMessage.error('文件读取失败！');
        }
      };
    }
  }
  input.click();
}

const confirmChageAvatar = () => {
  if (chageUserAvatar.value && uploadfile.value) {
    dialogAvatarVisible.value = false;
    const loadingInstance = ElLoading.service({
      text: '头像上传中...',
      fullscreen: true
    })

    UserRequest.avatar(uploadfile.value)
      .then(res => {
        console.log(res);
        if (res.data.err === ApiStatus.success) {
          loadingInstance.close();
          ElMessage.success("头像修改成功！");
          location.reload();
        } else ElMessage.error(res.data.result);
      })
      .catch(err => {
        console.log(err);
        loadingInstance.close();
        ElMessage.error('头像上传失败！');
      })
  } else ElMessage.error('头像文件错误！');
}

</script>

<style lang="scss">
.user {
  .icon {
    width: 1.4em;
    height: 1.4em;
    overflow: hidden;
    vertical-align: -0.15em;
    fill: currentcolor;
  }
}
</style>

<style lang="scss" scoped>
.page-content {
  width: 100%;
  height: 100%;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;

  $box-radius: 12px;

  .box-style {
    border: 1px solid var(--art-border-color);
  }

  .content {
    position: relative;
    display: flex;
    justify-content: space-between;
    margin-top: 10px;

    .left-wrap {
      width: 450px;
      margin-right: 25px;

      .user-wrap {
        position: relative;
        height: 600px;
        padding: 35px 40px;
        overflow: hidden;
        text-align: center;
        background: var(--art-main-bg-color);
        border-radius: $box-radius;

        .bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 200px;
        }

        .avatar {
          position: relative;
          z-index: 10;
          width: 80px;
          height: 80px;
          margin-top: 120px;
          object-fit: cover;
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: pointer;
        }

        .name {
          margin-top: 20px;
          font-size: 22px;
          font-weight: 400;
        }

        .des {
          margin-top: 20px;
          font-size: 14px;
        }

        .outer-info {
          width: 300px;
          margin: auto;
          margin-top: 30px;
          text-align: left;

          >div {
            margin-top: 10px;

            span {
              margin-left: 8px;
              font-size: 14px;
            }
          }
        }

        .lables {
          margin-top: 40px;

          h3 {
            font-size: 15px;
            font-weight: 500;
          }

          >div {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 15px;

            >div {
              padding: 3px 6px;
              margin: 0 10px 10px 0;
              font-size: 12px;
              background: var(--art-main-bg-color);
              border: 1px solid var(--art-border-color);
              border-radius: 2px;
            }
          }
        }
      }

      .gallery {
        margin-top: 25px;
        border-radius: 10px;

        .item {
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
      }
    }

    .right-wrap {
      flex: 1;
      overflow: hidden;
      border-radius: $box-radius;

      .info {
        background: var(--art-main-bg-color);
        border-radius: $box-radius;

        .title {
          padding: 15px 25px;
          font-size: 20px;
          font-weight: 400;
          color: var(--art-text-gray-800);
          border-bottom: 1px solid var(--art-border-color);
        }

        .form {
          box-sizing: border-box;
          padding: 30px 25px;

          >.el-row {
            .el-form-item {
              width: calc(50% - 10px);
            }

            .el-input,
            .el-select {
              width: 100%;
            }
          }

          .right-input {
            margin-left: 20px;
          }

          .el-form-item-right {
            display: flex;
            align-items: center;
            justify-content: end;

            .el-button {
              width: 110px !important;
            }
          }
        }
      }
    }
  }
}

@media only screen and (max-width: $device-ipad-vertical) {
  .page-content {
    .content {
      display: block;
      margin-top: 5px;

      .left-wrap {
        width: 100%;
      }

      .right-wrap {
        width: 100%;
        margin-top: 15px;
      }
    }
  }
}
</style>
