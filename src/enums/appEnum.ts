// 系统级别枚举

// App theme enum
export enum SystemThemeEnum {
  DARK = 'dark',
  LIGHT = 'light',
  AUTO = 'auto'
}

// Menu theme enum
export enum MenuThemeEnum {
  DARK = 'dark',
  LIGHT = 'light',
  DESIGN = 'design'
}

// Menu open or close width
export enum MenuWidth {
  OPEN = '210px',
  CLOSE = '70px'
}

// Language
export enum LanguageEnum {
  ZH = 'zh',
  EN = 'en'
}

// 用户性别
export enum UserSex {
  MALE = 1,
  FEMALE = 0,
  OTHER = 2
}

export enum PowerType {
  NULL = -1, //无权限
  ORDINARY = 0, //普通
  COMMITTEE = 1, //班委
  COUNSELOR = 2, //辅导员
  ADMIN = 3 //管理员
}

export enum FileState {
  SUCCESS = 1, // 正常
  ABNORMAL = 2, // 异常
  DELETE = -1, // 删除
  WAITING = 0 // 等待
}

export enum TaskType {
  ARRIVE = 1,
  WORK = 2,
  NOTICE = 3
}
