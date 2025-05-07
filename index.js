var parser = require("./lib/parser");
var dumper = require("./lib/dumper");

module.exports.parse = parser.parse;
module.exports.parseObjct = parser.parseObjct;
module.exports.parseFile = parser.parseFile;

module.exports.saveFile = dumper.saveFile;
module.exports.string = dumper.string