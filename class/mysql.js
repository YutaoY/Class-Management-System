const mysql = require('mysql2');

const mysqlConf = {
  host: "localhost",
  port: "3306",
  user: "root",
  password: "",
  database: "class"
}

function handleError(err) {
  throw "MYSQL DB错误：", err.stack || err;
}

function connect() {
  const db = mysql.createConnection(mysqlConf);
  db.connect(function (err) {
    if (err) {
      console.log("error when connecting to db,reConnecting after 2 seconds:", err);
      setTimeout(connect, 2000);
    }
  });
  db.on("error", handleError);
  return db;
}

module.exports = {
  connect
};