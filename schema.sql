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

DROP TABLE IF EXISTS `labels`;
CREATE TABLE `labels` (
  `name` varchar(64) NOT NULL,
  `label` varchar(64) NOT NULL
);

DROP TRIGGER IF EXISTS `timestmap_update`;
CREATE TRIGGER `timestmap_update` AFTER INSERT
ON `list`
BEGIN
  UPDATE list_info SET timestamp = unixepoch() WHERE name = new.type;
END;
