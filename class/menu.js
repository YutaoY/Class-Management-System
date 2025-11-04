const util = require('./function');

const menuListAll = [{
    id: 1,
    title: '数据汇总',
    title_en: 'Dashboard',
    name: 'Dashboard',
    icon: '\ue721',
    path: '/dashboard',
    power: util.POWER.ORDINARY,
    children: [{
        id: 101,
        title: '数据摘要',
        title_en: 'Workbench',
        path: '/dashboard/console',
        power: util.POWER.ORDINARY
      },
      {
        id: 102,
        title: '数据看板',
        title_en: 'Blueprint',
        path: '/dashboard/blueprint',
        power: util.POWER.ORDINARY
      }
    ]
  },
  {
    id: 2,
    title: '班级管理',
    name: 'User',
    title_en: 'User manguage',
    icon: '\ue86e',
    path: '/user',
    power: util.POWER.ORDINARY,
    children: [{
        id: 201,
        title: '班级列表',
        title_en: 'Class management',
        path: '/class/list',
        power: util.POWER.ORDINARY
      },
      {
        id: 202,
        title: '班级成员',
        title_en: 'Account manguage',
        path: '/user/account',
        power: util.POWER.ORDINARY
      },
      {
        id: 203,
        title: '班级课程表',
        title_en: 'KCB manguage',
        path: '/class/kcb',
        power: util.POWER.ORDINARY
      },
      {
        id: 205,
        title: '班级信息修改',
        title_en: 'Class Update',
        path: '/class/update',
        power: util.POWER.ADMIN,
        noMenu: true
      },
      {
        id: 206,
        title: '学生信息修改',
        title_en: 'User Update',
        path: '/user/update',
        power: util.POWER.ADMIN,
        noMenu: true
      },
    ]
  },
  {
    id: 3,
    title: '班级任务',
    name: 'Task',
    title_en: 'Class Task',
    icon: '\ue7ae',
    path: '/task',
    power: util.POWER.ORDINARY,
    children: [{
        id: 301,
        title: '发布任务',
        title_en: 'Publish Task',
        path: '/task/add',
        power: util.POWER.COMMITTEE
      },
      {
        id: 302,
        title: '全部任务',
        title_en: 'All Task',
        path: '/task/all',
        power: util.POWER.ORDINARY
      },
      {
        id: 303,
        title: '考勤汇总',
        title_en: 'Attendance Task',
        path: '/task/attendance',
        power: util.POWER.ORDINARY
      },
      {
        id: 304,
        title: '编辑任务',
        title_en: 'Update Task',
        path: '/task/update',
        power: util.POWER.COMMITTEE,
        noMenu: true
      },
      {
        id: 305,
        title: '任务详情',
        title_en: 'Get Task',
        path: '/task/get',
        power: util.POWER.ORDINARY,
        noMenu: true
      },
    ]
  },
  {
    id: 9,
    title: '版本日志',
    title_en: 'Version Plan',
    icon: '\ue712',
    path: '/plan',
    name: 'Plan',
    power: util.POWER.ORDINARY,
    children: [{
      id: 901,
      title: '更新日志',
      title_en: 'Update Plan',
      power: util.POWER.ORDINARY,
      path: '/plan/index'
    }]
  }
]

const getFilterArray = async (userpower) => {
  let menuIndex = 0;
  let menuListArray = [];
  menuListAll.forEach(item => {
    if (item.power <= Number(userpower)) {
      menuListArray.push({
        id: item.id,
        title: item.title,
        title_en: item.title_en,
        name: item.name,
        icon: item.icon,
        path: item.path,
        children: []
      });
      if (userpower === util.POWER.ADMIN) {
        menuListArray[menuIndex].children = item.children;
      } else item.children.forEach(child => {
        if (child.power <= Number(userpower)) {
          menuListArray[menuIndex].children.push(child);
        }
      });
      menuIndex++;
    }
  })
  return menuListArray;
}

module.exports.getMenuList = (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then(async (userpower) => {
        resolve(util.returnJSON(util._ERR.Err_1000, await getFilterArray(Number(userpower)), "菜单获取成功"));
      })
      .catch(err => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}