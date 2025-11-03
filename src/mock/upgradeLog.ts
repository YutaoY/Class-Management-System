export const upgradeLogList = ref([
  {
    version: 'V1.1.4',
    title: '数据看板展示更多考勤分析数据',
    content: [
      "新增 数据大屏专用考勤数据展示(V1.0.0)",
      "优化 部分页面的样式及数据请求逻辑",
      "优化 减少部分页面的卡顿",
      "修复 部分页面异常问题"
    ],
    date: '2025-7-26',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.1.3',
    title: '任务数据实时同步',
    content: [
      "新增 实时同步任务的数据，包括任务的新增、修改、删除",
      "优化 整体系统的网络请求速度（包含后端）",
      "优化 些许界面的交互及显示"
    ],
    date: '2025-7-10',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.1.2',
    title: '零碎的系统更新',
    content: [
      "新增 考勤任务支持搜索成员（突出显示）",
      "优化 将“保存考勤”换成“不更改，跳过”。点击单个成员进行更改考勤状态后跳转下一个成员。",
      "修复 首次引导的显示逻辑"
    ],
    date: '2025-6-04',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.1.1',
    title: '支持查看单个课程考勤汇总',
    content: [
      "新增 在班级考勤汇总页面，查看当前学期范围内的考勤时间范围，可以选择某个课程",
      "新增 （电脑端）在上述操作后，点击旁边的“打印”按钮，可将数字考勤数据打印成纸质考勤表",
      "新增 系统首次使用引导"
    ],
    date: '2025-5-30',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.1.0',
    title: '请假报备系统上线',
    content: [
      "新增 请假报备系统:在首页的右下角提交请假报备信息，考勤时快捷标记为请假人员",
      "优化 用户在未登录时访问需登录权限的页面时，登录完毕后将恢复跳转至",
      "优化 在任务详情页当任务获取失败，提供“返回”、“回到首页”选项"
    ],
    date: '2025-5-28',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.0.5',
    title: '系统底层的优化及修复',
    content: [],
    date: '2025-5-22',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.0.4',
    title: '新增考勤统计展示',
    content: [
      "新增 数据摘要页中考勤负责人和班级管理员可选择查看其他班级成员的考勤数据",
      "新增 班级成员页面列表中新增 请假、违纪 统计数据",
      "优化 部分页面数据获取方式及展示逻辑",
    ],
    date: '2025-5-21',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.0.3',
    title: '优化系统体验',
    content: [
      "优化 首次加载时，页面不会重新加载",
    ],
    date: '2025-5-20',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.0.2',
    title: '修复考勤任务数据问题',
    content: [
      "修复 保存单个任务考勤数据时，如之前查看过其余任务，则会覆盖这些任务考勤数据",
    ],
    date: '2025-5-18',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.0.1',
    title: '修复任务发布的一些问题',
    content: [
      "优化 考勤周数以考勤时间计算",
      "修复 考勤时间修改后发布后无效",
      "修复 复制考勤数据时，任务配置数据不生效"
    ],
    date: '2025-5-13',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'V1.0.0',
    title: '正式版(V1.0.0)正式发布',
    content: [],
    date: '2025-4-28',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'Bate V1.1.0',
    title: '内部试用版(Bate V1.1.0)正式发布',
    content: [],
    date: '2024-11-20',
    status: 'complete',
    statusText: '完成'
  },
  {
    version: 'Bate V1.0.0',
    title: '内部测试版(Bate V1.0.0)临时发布',
    content: [],
    date: '2024-10-30',
    status: 'complete',
    statusText: '完成'
  }
])
