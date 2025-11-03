import type { FormInstance, FormRules } from 'element-plus'
// 表单验证
export const validateTel = (rule: any, value: string, callback: any) => {
  if (value === '')
    callback(new Error('请填写手机号码'));
  if (String(value).length != 11 || Number.isNaN(Number(value)))
    callback(new Error('请输入正确的手机号格式'));
  callback();
}

export const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields();
}