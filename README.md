## 关于 班级管理系统

> 本系统由 [art-design-pro](https://github.com/Daymychen/art-design-pro) 开源模板改制

系统包含了主要的班级管理，任务（作业、考勤）管理等...

<br/>

## 用前须知

- 修改`.env`文件的API接口地址
- 修改`src/views/task/View.vue`375行的网站地址
- 修改后端`mysql.js`中的数据库信息

因请假报备模块的需要，用到了腾讯云的通用文字识别接口，如有需要请修改后端`operate/leave.js`36行的API信息

<br/>

## 安装运行

```sh
# 安装依赖
npm install

# 本地开发环境启动
npm dev

# 生产环境打包
npm build
```