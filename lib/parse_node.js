const macros = require("./macros.js");
const yamlnode = require("./node.js");
const config = require("./config.js");
const parse_line = require("./parse_line.js");

// 分行
function getLines(context) {
  if (context.indexOf("\r") !== -1) {
    context = context.split("\r\n").join("\n").split("\r").join("\n");
  }

  let lines = context.split("\n").filter((l) => l.trim() !== "");
  return lines;
}

// 规整
function standardLines(lines) {
  let newLines = [];
  for (let i = 0; i < lines.length; i++) {
    let lineString = lines[i];
    // 空行，跳过
    if (getCurrentLineType(lineString) == macros.LineTypeEmpty) {
      continue;
    }

    // 如果是注释，需要规整一下
    let tempLineString = lineString.slice();
    if (tempLineString.trim()[0] == "#") {
      // 替换# 到字符串前面
      tempLineString = tempLineString.replace("#", "");

      // 取退格
      let tempIndent = getIndent(tempLineString);
      let space = "".padStart(tempIndent * config.config.indentCount, " ");

      lineString = space + "# " + tempLineString.trim();
      // log.debug(lineString + " >>" + tempIndent)
    }

    newLines.push(lineString);
  }
  return newLines;
}

// 解析第一行
function parseFirstLine(node, lines) {
  for (let i = 0; i < lines.length; i++) {
    let lineString = lines[i];
    parse_line.parseContent(node, lineString);
    if (node.key != undefined && node.parent != undefined) {
      node.parent.type = macros.Nodetype_Map;
    }
    break;
  }
  return lines.slice(1);
}

// 解析当前块, 1 一行（同级的都已经放入兄弟结点中了;2 多行，除第一行，都是子节点的; 3 没有空行
function parseChildContext(node, lines) {
  let currentChildNode = undefined;
  let childLines = [];
  let descLines = [];

  for (let i = 0; i < lines.length; i++) {
    let lineString = lines[i];

    let indent = getIndent(lineString);

    if (indent <= node.indent) {
      let tempLineString = lineString.slice();
      if (tempLineString.trim()[0] == "#") {
        descLines.push(lineString);
        continue;
      }
    }

    if (currentChildNode == undefined) {
      // 第一行
      // 处理注释行
      if (descLines.length > 0) {
        let descChildNode = new yamlnode.Node(node, indent);
        descLines = parseFirstLine(descChildNode, descLines); // 处理掉第一条
        if (descChildNode.desc != undefined) {
          parseChildContext(descChildNode, descLines);
          node.childs.push(descChildNode);
        }
        descLines = [];
      }

      currentChildNode = new yamlnode.Node(node, indent);
      childLines.push(lineString);
      continue;
    }

    if (indent == currentChildNode.indent) {
      // 与子节点同级
      childLines = parseFirstLine(currentChildNode, childLines); // 处理掉第一条
      parseChildContext(currentChildNode, childLines); // 解析子节点
      node.childs.push(currentChildNode);

      // 处理注释行
      if (descLines.length > 0) {
        let descChildNode = new yamlnode.Node(node, indent);
        descLines = parseFirstLine(descChildNode, descLines); // 处理掉第一条
        if (descChildNode.desc != undefined) {
          parseChildContext(descChildNode, descLines);
          node.childs.push(descChildNode);
        }
        descLines = [];
      }

      currentChildNode = new yamlnode.Node(node, indent);
      childLines = [];
    }
    if (descLines.length > 0) {
      childLines.push(...descLines); // 处理注释行
    }
    descLines = [];
    childLines.push(lineString);
  }

  if (currentChildNode != undefined) {
    let childLinesWithoutFirst = parseFirstLine(currentChildNode, childLines); // 处理掉第一条
    parseChildContext(currentChildNode,childLinesWithoutFirst); // 解析子节点
    if (currentChildNode.type == macros.Nodetype_Init) {
      log.warn("parse error", childLines);
    } else {
      node.childs.push(currentChildNode);
      childLines = [];
    }
  }
}

// 获取缩进空格数量
function getSpace(lineString) {
  return (lineString.match(/^\s*/) || "")[0];
}

// 获取缩进
function getIndent(lineString) {
  // 1 取退格
  let spaceCount = getSpace(lineString).length;
  return Math.floor(spaceCount / config.config.indentCount);
}

// 获取行的yaml类型
function getCurrentLineType(lineString) {
  var trimmedLine = lineString.slice().trim();
  if (trimmedLine.length === 0) return macros.LineTypeEmpty;
  return macros.LineTypeContext;
}

function parseNode(node, context) {
  if (!(node instanceof yamlnode.Node)) {
    throw Error("yaml obj type error");
  }

  if (!context || typeof context !== "string") {
    throw new Error("Invalid YAML string");
  }

  let newLines = standardLines(getLines(context));

  parseChildContext(node, newLines);
}

module.exports.parseNode = parseNode;
module.exports.getLines = getLines;
module.exports.parseFirstLine = parseFirstLine;
module.exports.standardLines = standardLines;
module.exports.parseChildContext = parseChildContext;
