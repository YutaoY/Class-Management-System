import request from '@/utils/http'
import { computed } from "vue";
import { BaseResult } from '@/types/axios'
import { useUserStore } from '@/store/modules/user'
import { FileParams } from './model/sendModel'
import { FileUpload } from '@/types/store';
import axios from 'axios';
import { Md5 } from 'ts-md5';
import { FileState } from '@/enums/appEnum';

const getUserData = computed(() => {
  const userStore = useUserStore().getUserInfo;
  return {
    id: userStore.id,
    token: userStore.token
  }
})

class FileService {
  static request(url: string, params?: any) {
    new FormData
    return request.post<BaseResult>({
      url: `/file-${url}`, params
    })
  }
}

const setFormData = (params: { body: FileUpload, folder: string }) => {
  const formData = new FormData();
  formData.append('id', getUserData.value.id as string);
  formData.append('token', getUserData.value.token as string);
  formData.append('folder', params.folder as string);
  let key: keyof FileUpload;
  for (key in params.body)
    formData.append(key.toString(), params.body[key] as string);
  return formData;
}

export const FileRequest = {
  _upload(filename: string) {
    return FileService.request('repeat', { id: getUserData.value.id, name: filename })
  },
  upload(params: { body: FileUpload, folder: string }) {
    if (!params.body.isPaw) params.body.password = '(NoPassword)';
    else params.body.password = new Md5().appendAsciiStr(params.body.password).end() as string
    return axios.post(`${import.meta.env.VITE_API_URL}/upload-file`, setFormData(params))
  },
  getUser() {
    return FileService.request('user', { ...getUserData.value });
  },
  getClass(classid: string) {
    return FileService.request('class', { ...getUserData.value, classid });
  },
  getAll() {
    return FileService.request('all', { ...getUserData.value });
  },
  update(fileid: string, newState: FileState) {
    return FileService.request('update', { ...getUserData.value, fileid, state: newState });
  },
  download(params: Partial<FileParams>) {
    return axios.get(`${import.meta.env.VITE_API_URL}/file-down?id=${getUserData.value.id}&token=${getUserData.value.token}&fileid=${params.fileid}&password=${params.password}`);
  }
}