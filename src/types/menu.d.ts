import { PowerType } from "@/enums/appEnum";

export type MenuListType = {
  id: number
  title: string
  name?: string
  icon?: string
  path: string
  power?: PowerType
  title_en?: string
  noMenu?: boolean // 是否在菜单中隐藏
  children?: MenuListType[]
  authList?: Array
}
