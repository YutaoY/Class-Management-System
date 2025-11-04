/*
Navicat MySQL Data Transfer

Source Server         : 本地数据库
Source Server Version : 80042
Source Host           : localhost:3306
Source Database       : class

Target Server Type    : MYSQL
Target Server Version : 80042
File Encoding         : 65001

Date: 2025-11-04 18:22:49
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `class`
-- ----------------------------
DROP TABLE IF EXISTS `class`;
CREATE TABLE `class` (
  `id` varchar(255) NOT NULL,
  `school` longtext NOT NULL,
  `subsidiary` longtext,
  `name` longtext NOT NULL,
  `counselor` longtext NOT NULL,
  `tel` longtext NOT NULL,
  `JW` longtext,
  `XW` longtext,
  `KCB` longtext NOT NULL,
  `state` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of class
-- ----------------------------

-- ----------------------------
-- Table structure for `file`
-- ----------------------------
DROP TABLE IF EXISTS `file`;
CREATE TABLE `file` (
  `id` longtext,
  `user` longtext,
  `class` longtext,
  `type` int DEFAULT NULL,
  `name` longtext,
  `md5` longtext,
  `size` int DEFAULT NULL,
  `folder` longtext,
  `time` longtext,
  `state` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of file
-- ----------------------------

-- ----------------------------
-- Table structure for `off`
-- ----------------------------
DROP TABLE IF EXISTS `off`;
CREATE TABLE `off` (
  `id` varchar(255) NOT NULL,
  `user` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `md5` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `start` varchar(255) NOT NULL,
  `end` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `text` longtext,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of off
-- ----------------------------

-- ----------------------------
-- Table structure for `task`
-- ----------------------------
DROP TABLE IF EXISTS `task`;
CREATE TABLE `task` (
  `id` varchar(255) NOT NULL,
  `user` longtext NOT NULL,
  `class` longtext NOT NULL,
  `title` longtext NOT NULL,
  `content` longtext,
  `file` longtext NOT NULL,
  `type` int NOT NULL,
  `week` int NOT NULL,
  `lock` int NOT NULL,
  `uselist` int NOT NULL,
  `list` longtext,
  `start` longtext NOT NULL,
  `end` longtext,
  `state` varchar(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of task
-- ----------------------------

-- ----------------------------
-- Table structure for `user`
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` longtext NOT NULL,
  `student` int unsigned NOT NULL AUTO_INCREMENT,
  `name` longtext NOT NULL,
  `sex` int NOT NULL,
  `avatar` longtext,
  `position` longtext,
  `address` longtext,
  `blurb` longtext,
  `tag` longtext,
  `paw` longtext NOT NULL,
  `token` longtext,
  `class` longtext,
  `power` int NOT NULL,
  `state` int NOT NULL,
  `lasttime` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`student`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of user
-- ----------------------------
