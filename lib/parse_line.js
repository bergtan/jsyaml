const macros = require("./macros.js");
const yamlnode = require("./node.js");
const config = require("./config.js");

function parserYamlKVContext(yamlContext) {
  let detail = {};
  const regex = /(: +|:$)+/g; // 判断，是不是有key

  let items = yamlContext.split(regex).filter((f) => {
    if (f) return true;
    return false;
  });

  // log.info("parserYamlContext:", items)

  if (items.length <= 0) {
    detail["err"] = Error("parse yaml kv context err! " + yamlContext, items);
  } else {
    if (items.length == 1) {
      // 没有 :, 这里字符是value
      detail["value"] = items[0].trim();
    } else {
      detail["key"] = items[0].trim();
      if (items.length > 2) {
        // 有值
        detail["value"] = items[2].trim();
      }
    }
  }
  return detail;
}

function addCNode(node) {
  let cNode = undefined;
  switch (node.type) {
    case macros.Nodetype_Sequence:
    case macros.Nodetype_Map:
      cNode = new yamlnode.Node(node, node.indent + 1);
      node.childs.push(cNode);
      break;
    default:
      log.error("no support add node");
  }
  return cNode;
}

function parseContent(node, lineString) {
  // 分割 注释
  const regex = /(^#| +#)/g; // 注释 只匹配一次
  let items = lineString.split(regex);

  let yamlContext = "";
  // let splitContext = "" // 注释开头的空格在 #号的前面
  let descContext = "";

  if (items.length == 1) {
    // 没有 #（注释）
    yamlContext = items[0];
  } else {
    for (let i = 0; i < items.length; i++) {
      let context = items[i].trim();
      if (context == "#") {
        yamlContext = items.slice(0, i).join("");
        // splitContext = items[i]
        descContext = items.slice(i + 1, items.length).join("");
        break;
      }
    }
  }

  // 处理这一行的注释数据
  if (descContext.trim() != "") {
    node.desc = descContext.trim().slice();
  }

  // ----------------------------------------
  yamlContext = yamlContext.trim(); // 空格不需要了
  if (yamlContext == "") {
    // 没有内容
    if (descContext.trim() == "") {
      // 注释也是空的，这一行，没有意义
      log.warn("context desc empty");
      return;
    }

    // 注释
    node.type = macros.Nodetype_Desc;
    node.desc = descContext.trim().slice();
    return;
  }

  //-------------------------
  // 数组元素
  if (yamlContext[0] == "-") {
    if (node.parent.type == macros.Nodetype_Init) {
      node.parent.type = macros.Nodetype_Sequence;
    }

    if (node.parent.type != macros.Nodetype_Sequence) {
      log.error("get error node data", yamlContext);
      return;
    }

    yamlContext = yamlContext.slice(1, yamlContext.length).trim(); // '-'不需要了
    let detail = parserYamlKVContext(yamlContext);
    if (detail["err"] != undefined) {
      console.warn(detail["err"]);
      return undefined;
    }

    if (detail["key"] == undefined) {
      if (detail["value"] == undefined) {
        return;
      }

      // 只有value
      node.type = macros.Nodetype_Value;
      node.value = detail["value"];
    } else {
      // 有key
      node.type = macros.Nodetype_Map;

      let cNode = addCNode(node);
      cNode.key = detail["key"];
      if (detail["value"] == undefined) {
        cNode.type = macros.Nodetype_Map;
        return;
      }
      cNode.type = macros.Nodetype_Value;
      cNode.value = detail["value"];
      cNode.desc = descContext.trim().slice();
    }

    return;
  }

  //-----------------------
  let detail = parserYamlKVContext(yamlContext);
  if (detail["err"] != undefined) {
    console.warn(detail["err"]);
    return undefined;
  }

  // log.debug(detail)
  if (detail["key"] == undefined) {
    if (detail["value"] == undefined) {
      console.warn("value error! " + yamlContext);
      throw Error("key value error" + yamlContext);
    }

    // 没有key, 数据
    node.type = macros.Nodetype_Value;
    node.value = detail["value"];
    return;
  } else {
    // 这里有key
    if (detail["value"] == undefined) {
      // 没有值
      // 只有key
      node.key = detail["key"];
      return;
    }

    // log.info("kv:", yamlContext, currentNode)
    node.key = detail["key"];
    node.type = macros.Nodetype_Value;
    node.value = detail["value"];
    return;
  }
}

module.exports.parseContent = parseContent;
