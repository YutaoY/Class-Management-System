import { UserSex } from "@/enums/appEnum"

export interface UserDefualt {
  id: string,
  paw: string
  userid: string
  classid: string
  sex: UserSex
  name: string
  tel: string
  position?: string
  address?: string
  password: string
  token?: string
  state?: 0 | 1
}

export interface UserAvatar {
  id: string,
  token: string
  file: File
}