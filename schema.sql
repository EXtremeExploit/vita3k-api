DROP TABLE IF EXISTS `list`;
CREATE TABLE `list` (
  `type` varchar(50) DEFAULT NULL,
  `name` varchar(1024) DEFAULT NULL,
  `titleId` varchar(10)  NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `issueId` INTEGER PRIMARY KEY DEFAULT NULL
);

DROP TABLE IF EXISTS `list_info`;
CREATE TABLE `list_info` (
  `name` varchar(64) PRIMARY KEY NOT NULL, -- What the api provides
  `githubName` varchar(128) NOT NULL, -- Used internally to get github issues
  `timestamp` INTEGER NOT NULL DEFAULT 0
);
