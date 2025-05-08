const yamlnode = require("./node.js");
const parse_node = require("./parse_node.js");
const macros = require("./macros.js");
const api_ret = require("./ret.js");

function getNodeByKeyValue(node, key, value) {
  let tempNode = undefined;
  for (let i = 0; i < node.childs.length; i++) {
    let c = node.childs[i];
    if (node.type == macros.Nodetype_Sequence) {
      if (parseInt(key) == i) {
        if (value != undefined && c.value != value) {
          continue;
        }
        tempNode = c;
        break;
      }
    } else {
      if (key == c.key) {
        if (value != undefined && c.value != value) {
          continue;
        }
        tempNode = c;
        break;
      }
    }
  }
  return tempNode;
}

// 查询节点数据
function getNode(node, keypathArray) {
  let currentNode = node;

  for (let i in keypathArray) {
    let key = keypathArray[i];
    let value = undefined;

    if (!currentNode) {
      return undefined;
    }

    // 上层
    if (key == "..") {
      currentNode = currentNode.parent;
      continue;
    }

    // 索引
    if (key[0] == "#") {
      try {
        let index = parseInt(key.replace("#", ""));
        currentNode = currentNode.childs[index];
      } catch (e) {
        log.warn(e);
      }
      continue;
    }

    // key里带value
    if (key.includes(":")) {
      let keyValue = key.split(":");
      key = keyValue[0];
      value = keyValue[1];
    }

    currentNode = getNodeByKeyValue(currentNode, key, value);
  }

  return currentNode;
}

// 修改节点数据
function setNodeData(node, keypathArray, newNode) {
  if (keypathArray.length == 0 && newNode != undefined) {
    if (newNode.type != undefined && newNode.type != macros.Nodetype_Init)
    node.type = newNode.type;
    if (newNode.key != undefined) node.key = newNode.key;
    if (newNode.desc != undefined) node.desc = newNode.desc;
    if (newNode.value != undefined) node.value = newNode.value;
    node.childs = [...newNode.childs];
    return api_ret.success();
  }

  let currentNode = getNode(node, keypathArray.slice(0, -1));
  if (currentNode == undefined) {
    return api_ret.fail("节点：‘" + keypathArray.join(".") + "’未找到");
  }
  //--------------------------------------------
  const lastKey = keypathArray[keypathArray.length - 1];
  if (newNode == undefined) {
    // delete currentNode[lastKey]
  } else {
    let tempNode = getNodeByKeyValue(currentNode, lastKey, undefined);
    if (tempNode == undefined) {
      newNode.parent = currentNode;
      currentNode.childs.push(newNode);
      return api_ret.success();
    }

    if (newNode.type != undefined && newNode.type != macros.Nodetype_Init)
      tempNode.type = newNode.type;
    if (newNode.key != undefined) tempNode.key = newNode.key;
    if (newNode.desc != undefined) tempNode.desc = newNode.desc;
    if (newNode.value != undefined) tempNode.value = newNode.value;
    tempNode.childs = [...newNode.childs];
  }

  return api_ret.success(); // 修改成功
}

function setDesc(node) {
  if (!(node instanceof yamlnode.Node)) {
    throw Error("yaml obj type error");
  }

  let yamlContext = node.toYAMLString();

  let tempNode = new yamlnode.Node();
  let lines = parse_node.getLines(yamlContext);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (
      i == 0 &&
      node.parent != undefined &&
      node.parent.type == macros.Nodetype_Sequence
    ) {
      lines[i] = "# - " + line;
    } else {
      lines[i] = "# " + line;
    }
  }
  let newLines = parse_node.standardLines(lines);

  let tempLines = parse_node.parseFirstLine(tempNode, newLines); // 处理掉第一条
  parse_node.parseChildContext(tempNode, tempLines);

  // 转注释节点
  node.type = tempNode.type;
  node.key = tempNode.key;
  node.desc = tempNode.desc;
  node.value = tempNode.value;
  node.childs = [...tempNode.childs];
}


module.exports.getNode = getNode;
module.exports.getNodeByKeyValue = getNodeByKeyValue;
module.exports.setDesc = setDesc;
module.exports.setNodeData = setNodeData;