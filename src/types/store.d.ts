import { UserSex, MenuThemeEnum, SystemThemeEnum, FileState } from '@/enums/appEnum'
import { PowerType } from '@/enums/appEnum'
import { AttendanceEnum } from '@/enums/classEnum'

export interface DailyAttendance {
  date: string;
  attendanceRate: number;
  totalStudents: number;
  statusStats: {
    arrived: string[];
    late: string[];
    sickLeave: string[];
    personalLeave: string[];
    absent: string[];
    earlyLeave: string[];
  };
}

export interface SelectOption {
  label: string
  value: string
}

export interface KCBListType {
  name: string
  teacher: string
  address: string
}

export interface KCBType {
  first: string
  list: KCBListType[]
}

export interface AttendanceType {
  id: string
  state: AttendanceEnum
  notes: string
}

export interface TaskFile {
  fieldname: string,
  originalname: string,
  encoding: string,
  mimetype: string,
  destination: string,
  filename: string,
  path: string,
  size: number
}

export interface TaskInfo {
  id: string
  user: string
  title: string
  content: string
  file: string
  uselist: number
  lock: number
  type: TaskType
  week: number
  list: {
    all: string[]
    true: string[]
    false: string[]
    check: AttendanceType[]
  }
  start: string
  end?: string
}

export interface FileInfo {
  name: string;
  state: FileState;
  size?: number;
  id: string;
  isPaw: boolean
  isOpen: boolean
  time: number
  folder: string
  userid?: string
  classid?: string
}

export interface FileUpload {
  name: string;
  percentage?: number;
  status: UploadStatus;
  size?: number;
  response?: unknown;
  uid: number;
  url?: string;
  raw?: UploadRawFile;
  isPaw: boolean
  isOpen: boolean
  password: string
  class?: string
}

// 班级注册信息
export interface ClassRegister {
  name: string
  tel: string
  school: string
  counselor: string
  subsidiary: string
}

// 用户注册信息
export interface UserRegister {
  sex: UserSex
  name: string
  position: string
  address: string
  password: string
  result?: boolen
}

// 班级信息
export interface ClassInfo {
  id: string
  name: string
  tel: string
  school: string
  counselor: string
  subsidiary: string
  JW: string
  XW: string
  KCB: KCBType[]
  state: number
}

// 用户信息
export interface UserInfo {
  id: string
  name: string
  avatar: string
  token: string
  tag?: string[]
  blurb?: string
  position: string
  sex: UserSex
  address?: string
  power: PowerType
  state?: number
  class?: string
  lasttime?: string
}

export interface UserParams {
  id: string,
  name: string,
  sex: UserSex,
  position: string,
  address: string,
  blurb: string,
  tag: string,
  paw: string,
  token: string,
  class: string,
  power: PowerType,
  state: 0 | 1
}

export interface ReturnData {
  text: string
  type: "info" | "success" | "warning" | "primary" | "danger"
  color: "#909399" | "#67C23A" | "#E6A23C" | "#409EFF" | "#F56C6C"
}

// 系统主题样式（light | dark）
export interface SystemThemeType {
  className: string // className
}

// 定义包含多个主题的类型
export type SystemThemeTypes = {
  [key in Exclude<SystemThemeEnum, SystemThemeEnum.AUTO>]: SystemThemeType
}

// 菜单主题样式
export interface MenuThemeType {
  theme: MenuThemeEnum // 主题名称
  background: string // 背景色
  systemNameColor: string // 系统标题颜色
  textColor: string // 文字颜色
  textActiveColor: string // 文字选中颜色
  iconColor: string // 图标颜色
  iconActiveColor: string // 图标选中颜色
  tabBarBackground: string // 顶栏背景色
  systemBackground: string // 系统背景色
  leftLineColor: string // 左侧线条颜色
  rightLineColor: string // 右侧线条颜色
}

// 设置中心
export interface Setting {
  theme: string // 主题
  uniqueOpened: boolean // 是否开启手风琴模式
  menuButton: boolean // 是否显示菜单展开按钮
  showRefreshButton: boolean // 是否显示页面刷新按钮
  showCrumbs: boolean // 是否显示全局面包屑
  autoClose: boolean // 设置后是否自动关闭窗口
  showWorkTab: boolean // 是否显示多标签
  showLanguage: boolean // 是否显示多语言选择
  showNprogress: boolean // 是否显示顶部进度条
  themeModel: string // 主题模式
}

// 多标签
export interface WorkTabType {
  title: string
  title_en?: string
  path: string
  params?: object
  query?: object
}
