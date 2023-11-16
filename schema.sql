-- Delete the tables in order (children to master)
DROP TABLE IF EXISTS `list`;
DROP TABLE IF EXISTS `labels`;
DROP TABLE IF EXISTS `list_info`;

-- Now create the tables (master to children)
CREATE TABLE `list_info` (
  `name` varchar(64) PRIMARY KEY NOT NULL, -- What the api provides
  `githubName` varchar(128) NOT NULL, -- Used internally to get github issues
  `timestamp` INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE `labels` (
  `name` varchar(64) NOT NULL, -- Name of the list (list_info.name)
  `label` varchar(64) NOT NULL, -- Name of the label
  PRIMARY KEY(`name`, `label`),
  FOREIGN KEY(`name`) REFERENCES list_info(`name`)
);

CREATE TABLE `list` (
  `type` varchar(64) NOT NULL, -- Name of the list (list_info.name)
  `name` varchar(1024) DEFAULT NULL, -- Name of the game
  `titleId` varchar(10) DEFAULT NULL, -- TITLEID of the game
  `status` varchar(64) DEFAULT NULL, -- Status of the game (Playable, Bootable or null for unknown)
  `color` varchar(7) DEFAULT NULL, -- The color of the label of the status
  `issueId` INTEGER NOT NULL, -- ID of the issue on the repository
  PRIMARY KEY(`type`, `issueId`),
  FOREIGN KEY(`type`) REFERENCES list_info(`name`)
);

-- Run this update everytime an insert to the list happens to update the last update time
DROP TRIGGER IF EXISTS `timestmap_update`;
CREATE TRIGGER `timestmap_update` AFTER INSERT
ON `list`
BEGIN
  UPDATE list_info SET timestamp = unixepoch() WHERE name = new.type;
END;
