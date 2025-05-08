var parser = require("./lib/parser");
var dumper = require("./lib/dumper");

var option = require("./lib/option");
var diffs = require("./lib/diffs");

// 解析
module.exports.parse = parser.parse;
module.exports.parseObjct = parser.parseObjct;
module.exports.parseFile = parser.parseFile;

// 导出、保存
module.exports.saveFile = dumper.saveFile;
module.exports.string = dumper.string

// 操作
module.exports.getNode = option.getNode;
module.exports.getNodeByKeyValue = option.getNodeByKeyValue;
module.exports.setDesc = option.setDesc;
module.exports.setNodeData = option.setNodeData;

// 对比
module.exports.setDiffs = diffs.setDiffs;
module.exports.compare = diffs.compare;