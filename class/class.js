const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const util = require('./function');
const user = require('./operate/user');
const file = require('./operate/file');
const banji = require('./operate/class');
const task = require('./operate/task');
const leave = require('./operate/leave');

const menu = require('./menu');
const multer = require('multer');
const path = require('path');
const fs = require("fs");

const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './file/')
  },
  filename: function (req, file, cb) {
    cb(null, req.body.md5)
  }
})

const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/avatar/')
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.id}-${new Date().getTime()}`)
  }
})

const fileUpload = multer({
  storage: uploadStorage
});

const userAvatar = multer({
  storage: avatarStorage
});

// 使用JSON格式
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use('/public', express.static(path.join(__dirname, 'public')));

// 设置跨域
app.all('*', function (req, res, next) {
  // res.header("Access-Control-Allow-Origin", "*");
  const origin = req.headers.origin; 
  const allowedDomainsRegex = /^https?:\/\/(.*\.)?ninemusic\.cn(:\d+)?$/;

  if (origin && allowedDomainsRegex.test(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.header("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.header("Access-Control-Allow-Headers", "X-Requested-With,content-type,Authorization");
  res.header("Content-Type", "application/json");
  res.header("X-Powered-By", ' 3.2.1');
  util.pm2Log_out('请求路径', req.url, "start");
  util.pm2Log_out('请求头部', {
    用户数据: decodeURIComponent(req.headers['authorization']),
    设备数据: req.headers['user-agent'],
    IP地址: ip
  }, "conent");
  util.pm2Log_out('请求参数', req.body || req.query, "conent");
  next();
});

/**
 * name: 班级管理系统API接口
 * version: v1.0.0
 * description: 用于"班级管理系统"后端开发
 * author: yutao
 */

app.get('/login-class', async (req, res) => {
  await user.getClass()
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-add', async (req, res) => {
  await user.add(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-login', async (req, res) => {
  await user.login(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-get', async (req, res) => {
  await user.self(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-getall', async (req, res) => {
  await user.getAll(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-verify', async (req, res) => {
  await user.verify(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-pswd', async (req, res) => {
  await user.password(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-update', async (req, res) => {
  await user.update(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-avatar', userAvatar.single("file"), async (req, res) => {
  await user.avatar(req.body, req.file)
    .then((result) => {
      res.send(result);
    })
});

app.post('/user-delete', async (req, res) => {
  await user.delete(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/menu-get', async (req, res) => {
  await menu.getMenuList(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/class-add', async (req, res) => {
  await banji.add(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/class-getall', async (req, res) => {
  await banji.getAll(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/class-get', async (req, res) => {
  await banji.get(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/class-update', async (req, res) => {
  await banji.update(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/file-upload', fileUpload.single("raw"), async (req, res) => {
  await file.upload(req.body, req.file)
    .then((result) => {
      res.send(result);
    })
});

app.post('/file-repeat', async (req, res) => {
  await file._upload(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/file-user', async (req, res) => {
  await file.getUserFile(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/file-class', async (req, res) => {
  await file.getClassFile(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/file-all', async (req, res) => {
  await file.getALLFile(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/file-update', async (req, res) => {
  await file.update(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.get('/file-down', async (req, res) => {
  await file.download(req.query)
    .then((result) => {
      if (req.query.down) {
        fs.stat(url, (err, stats) => {
          if (err) res.send({
            err: 1003
          })
          if (stats.isFile())
            res.download(path.join(__dirname + '/file/' + result.md5), result.name);
          else res.send({
            err: 1005
          });
        })
      } else res.send({
        err: 1000
      });
    })
    .catch((err) => {
      res.send(err);
    });
});

app.post('/task-add', async (req, res) => {
  await task.add(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/task-get', async (req, res) => {
  await task.get(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/task-lenght', async (req, res) => {
  await task.getLength(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/task-all', async (req, res) => {
  await task.getAll(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.get('/task-file-down', async (req, res) => {
  const result = req.query
  const url = path.join(__dirname + '/task/' + result.fileid)
  if (result.down)
    return res.download(url, result.filename);

  fs.stat(url, (err, stats) => {
    if (err) res.send({
      err: 1003
    })
    if (stats.isFile()) res.send({
      err: 1000
    });
    else res.send({
      err: 1005
    });
  })
});

app.post('/task-update-list', async (req, res) => {
  await task.updateList(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/task-update', async (req, res) => {
  await task.update(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/task-delete', async (req, res) => {
  await task.delete(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/screenshot', (req, res) => {
  var fileid = req.body.id;
  var imgData = req.body.base;
  var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
  var dataBuffer = Buffer.from(base64Data, 'base64');
  const url = path.join(__dirname + '/public/screenshot/' + fileid)
  fs.writeFile(url, dataBuffer, function (err) {
    if (err) res.send(util.returnJSON(util._ERR.Err_1005, "保存失败", err))
    else res.send(util.returnJSON(util._ERR.Err_1000, "保存成功", req.body))
  });
});

app.get('/down-screenshot', (req, res) => {
  const result = req.query
  const url = path.join(__dirname + '/public/screenshot/' + result.fileid)
  res.header("Content-Type", "image/png");
  return res.download(url, result.filename);
});

app.post('/leave-add', async (req, res) => {
  await leave.add(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/leave-class', async (req, res) => {
  await leave.getClass(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/leave-cover', async (req, res) => {
  await leave.getCover(req.body)
    .then((result) => {
      res.send(result);
    })
});

app.post('/leave-get', async (req, res) => {
  await leave.get(req.body)
    .then((result) => {
      res.send(result);
    })
});

// 启动服务接口 端口号：4248
app.listen(4248, () => util.pm2Log_out("班级管理系统服务启动", null, "conent"));