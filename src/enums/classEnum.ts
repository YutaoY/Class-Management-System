// 应用枚举

import { AttendanceType } from "@/types/store";

// 考勤类型
export enum AttendanceEnum {
  YD = 2,
  KK = 3,
  ZT = 4,
  CD = 5,
  SJ = 6,
  BJ = 7,
  WD = 8,
}

export function getAttendanceEnum(value: AttendanceEnum): { key: string; name: string } {
  const key = AttendanceEnum[value] as keyof typeof AttendanceEnum;

  if (!key) throw new Error('Invalid attendance value');

  const nameMap = {
    YD: '已到',
    KK: '旷课',
    ZT: '早退',
    CD: '迟到',
    SJ: '事假',
    BJ: '病假',
    WD: '未到'
  };

  return {
    key,
    name: nameMap[key]
  };
}

export interface AttendanceCategory {
  type: keyof typeof AttendanceEnum; // 类型键名，如 'YD', 'KK' 等
  name: string;                     // 中文名称
  records: AttendanceType[];      // 该分类下的记录
}

export function classifyAttendanceAsArray(records: AttendanceType[]): AttendanceCategory[] {
  // 初始化所有可能的分类
  const categories: AttendanceCategory[] = [
    { type: 'YD', name: '已到', records: [] },
    { type: 'KK', name: '旷课', records: [] },
    { type: 'ZT', name: '早退', records: [] },
    { type: 'CD', name: '迟到', records: [] },
    { type: 'SJ', name: '事假', records: [] },
    { type: 'BJ', name: '病假', records: [] },
    { type: 'WD', name: '未到', records: [] }
  ];

  // 遍历记录并分类
  records.forEach(record => {
    const type = AttendanceEnum[record.state] as keyof typeof AttendanceEnum;
    const category = categories.find(c => c.type === type);
    if (category) {
      category.records.push(record);
    }
  });

  // 过滤掉没有记录的分类（可选）
  return categories.filter(category => category.records.length > 0);
}
