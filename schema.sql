DROP TABLE IF EXISTS `list`;
CREATE TABLE `list` (
  `type` varchar(50) DEFAULT NULL,
  `name` varchar(1024) DEFAULT NULL,
  `titleId` varchar(10) PRIMARY KEY NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `issueId` INTEGER DEFAULT NULL
);

DROP TABLE IF EXISTS `timestamps`;
CREATE TABLE `timestamps` (
  `name` tinytext PRIMARY KEY NOT NULL,
  `timestamp` INTEGER NOT NULL DEFAULT 0
);
