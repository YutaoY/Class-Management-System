const mysqlJS = require('../mysql');
const util = require('../function');
const {
  v4: uuidv4
} = require('uuid');
const dayjs = require('dayjs');

module.exports.add = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.ORDINARY) {
          const uuid = uuidv4();
          mysqlJS.connect().query('INSERT INTO task SET id=?, user=?, class=?, title=?, content=?, file=?, type=?, week=?, `lock`=?, uselist=?, list=?, start=?, end=?, state=?',
            [uuid, userdata.id, userdata.class, userdata.title, userdata.content, JSON.stringify(userdata.files), userdata.type, userdata.week, userdata.lock, userdata.uselist, userdata.list, userdata.start, userdata.end, 1], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "发布失败", err));
              resolve(util.returnJSON(util._ERR.Err_1000, uuid, rows));
            })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "发布中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  });
}

module.exports.get = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('SELECT * FROM task WHERE id=? AND class=?',
            [userdata.taskid, userdata.classid], (err, res) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));

              if (res.length == 0)
                return resolve(util.returnJSON(util._ERR.Err_1002, "任务不存在", "任务不存在"));

              res[0].file = JSON.parse(res[0].file);
              res[0].list = JSON.parse(res[0].list);
              resolve(util.returnJSON(util._ERR.Err_1000, res[0], "获取班级信息成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getLength = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL) {
          mysqlJS.connect().query('SELECT * FROM task WHERE class=?', [userdata.classid], (err, rows) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
            resolve(util.returnJSON(util._ERR.Err_1000, rows.length, "获取班级任务成功"));
          })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getAll = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL) {
          let sql = "SELECT * FROM task WHERE class=? ORDER BY start DESC";
          let data = [userdata.classid];
          if (userdata.divide) {
            sql = "SELECT * FROM task WHERE class=? ORDER BY start DESC LIMIT ?,?";
            data = [userdata.classid, userdata.page, userdata.size]
          }
          mysqlJS.connect().query(sql, data, (err, rows) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
            rows.forEach(element => {
              element.file = JSON.parse(element.file);
              element.list = JSON.parse(element.list);
            });
            resolve(util.returnJSON(util._ERR.Err_1000, rows, "获取班级任务成功"));
          })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.updateList = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.ORDINARY) {
          let sql = {
            str: 'UPDATE task SET list=? WHERE id=? AND user=?',
            data: [userdata.list, userdata.taskid, userdata.id]
          };
          if (userpower === util.POWER.ADMIN) sql = {
            str: 'UPDATE task SET list=? WHERE id=?',
            data: [userdata.list, userdata.taskid]
          }
          mysqlJS.connect().query(sql.str, sql.data, (err, rows) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "修改错误", err));
            if (rows.changedRows == 0) return;
            resolve(util.returnJSON(util._ERR.Err_1000, rows, "修改成功"));
          })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "修改中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.update = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.ORDINARY) {
          mysqlJS.connect().query('UPDATE task SET user=?, title=?, content=?, file=?, week=?, `lock`=?, uselist=?,start=?, end=? WHERE id=?',
            [userdata.user, userdata.title, userdata.content, userdata.files, userdata.week, userdata.lock, userdata.uselist, userdata.start, userdata.end, userdata.taskid], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "保存错误", err));
              if (rows.changedRows == 0) return;
              resolve(util.returnJSON(util._ERR.Err_1000, rows, "保存成功"));
            })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "保存中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  });
}

module.exports.delete = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.ORDINARY) {
          mysqlJS.connect().query('DELETE FROM task WHERE id=?',
            [userdata.taskid], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "删除中出错", err));
              if (rows.affectedRows == 0)
                return resolve(util.returnJSON(util._ERR.Err_1002, "删除失败", "任务不存在"));
              if (rows.affectedRows == 1)
                return resolve(util.returnJSON(util._ERR.Err_1000, rows, "删除成功"));
            })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "删除中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  });
}