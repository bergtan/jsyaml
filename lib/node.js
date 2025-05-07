const config = require("./config.js");
const diffs = require("./diffs.js");
const macros = require("./macros.js");
const api_ret = require("./ret.js");

class Node {
  constructor(parent, indent = -1) {
    this.type = macros.Nodetype_Init;
    this.key = undefined;
    this.value = undefined;
    this.desc = undefined;

    this.childs = [];
    this.parent = parent;
    //
    this.indent = indent;
  }

  getPath() {
    let str = "";
    if (this.parent == undefined) {
      // 根
      if (this.key != undefined) {
        str = this.key;
      }
      return str;
    }

    let index = -1;
    str += this.parent.getPath();
    index = this.parent.childs.indexOf(this);

    let thisStr = "";
    if (this.key != undefined) {
      if (this.type == macros.Nodetype_Desc && index != -1) {
        thisStr = "#" + index;
      } else {
        thisStr = this.key;
      }
    } else if (index != -1) {
      thisStr = "#" + index;
    }

    if (thisStr != "" && str != "") {
      str += "." + thisStr;
    } else {
      str = thisStr;
    }

    return str;
  }

  // 获取 JavaScript 对象
  toObject() {
    let data = undefined;
    switch (this.type) {
      case macros.Nodetype_Map:
        data = {};
        for (let k in this.childs) {
          let c = this.childs[k];
          data[c.key] = c.toObject();
        }
        return data;
      case macros.Nodetype_Sequence:
        data = [];
        for (let k in this.childs) {
          let c = this.childs[k];
          data.push(c.toObject());
        }
        return data;
      case macros.Nodetype_Value:
        return this.value;
      case macros.Nodetype_Desc:
        return "";
    }
    return data;
  }

  // // 转换为 JSON 字符串
  // toJSONString(indent = null) {
  //     return JSON.stringify(this.data, null, indent);
  // }

  // 转换为 YAML 字符串
  getDesc() {
    if (this.desc != undefined) {
      return this.desc;
    }
    return "";
  }
  buildLines(lines) {
    try {
      let indentStr = "".padStart(1 * config.config.indentCount, " ");
      if (this.type == macros.Nodetype_Desc) {
        lines.push({ context: "", desc: this.getDesc() });
      } else {
        // 判断是否有上层节点
        if (this.parent != undefined) {
          switch (this.parent.type) {
            case macros.Nodetype_Map:
              if (this.key == undefined) {
                log.warn("node item key == undefined");
              } else {
                lines.push({
                  context:
                    this.key +
                    ":" +
                    (this.value == undefined ? "" : " " + this.value),
                  desc: this.getDesc(),
                });
              }
              break;
            case macros.Nodetype_Sequence:
              if (this.value != undefined) {
                lines.push({ context: this.value, desc: this.getDesc() });
              }
              break;
          }
        } else {
          if (this.value != undefined || this.desc != undefined) {
            lines.push({
              context: this.value == undefined ? "" : this.value,
              desc: this.getDesc(),
            });
          }
        }
      }

      // 关心子节点的
      switch (this.type) {
        case macros.Nodetype_Init:
          // 有注释结点，无法确定自己是什么类型节点
          for (let i = 0; i < this.childs.length; i++) {
            let c = this.childs[i];
            let tempLines = [];

            c.buildLines(tempLines);
            for (let j in tempLines) {
              tempLines[j]["context"] = indentStr + tempLines[j]["context"];
              lines.push(tempLines[j]);
            }
          }
          break;
        case macros.Nodetype_Map:
          if (
            this.parent == undefined ||
            this.parent.type == macros.Nodetype_Sequence
          ) {
            indentStr = ""; // 不添加退格
          }
          for (let i = 0; i < this.childs.length; i++) {
            let c = this.childs[i];
            let tempLines = [];

            c.buildLines(tempLines);
            for (let j in tempLines) {
              tempLines[j]["context"] = indentStr + tempLines[j]["context"];
              lines.push(tempLines[j]);
            }

            // 根节点，子节点间加一行
            if (this.parent == undefined && c.type != macros.Nodetype_Desc) {
              lines.push({ context: "", desc: "" });
            }
          }
          
        //   // 根节点， 最后也加一行
        //   if (this.parent == undefined) {
        //     lines.push({ context: "", desc: "" });
        //   }
          break;
        case macros.Nodetype_Sequence:
          for (let i = 0; i < this.childs.length; i++) {
            let c = this.childs[i];
            let tempLines = [];
            c.buildLines(tempLines, true);

            for (let j = 0; j < tempLines.length; j++) {
              if (j == 0 && tempLines[j]["context"].slice().trim() != "") {
                tempLines[j]["context"] =
                  indentStr + "- " + tempLines[j]["context"];
              } else {
                if (c.type == macros.Nodetype_Desc) {
                  tempLines[j]["context"] = indentStr + tempLines[j]["context"];
                } else {
                  tempLines[j]["context"] =
                    indentStr + indentStr + tempLines[j]["context"];
                }
              }
              lines.push(tempLines[j]);
            }
          }

          break;
        case macros.Nodetype_Desc:
          for (let i = 0; i < this.childs.length; i++) {
            let c = this.childs[i];
            let tempLines = [];
            c.buildLines(tempLines);

            for (let j = 0; j < tempLines.length; j++) {
              tempLines[j]["context"] = indentStr + tempLines[j]["context"];
              lines.push(tempLines[j]);
            }
          }
          break;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  toYAMLString() {
    try {
      let lines = [];
      this.buildLines(lines);

      // log.info(lines)

      let maxLen = 0;
      lines.map((l) => {
        let tempLen = l.context.length;
        if (l.desc.length > 0 && maxLen < tempLen) {
          maxLen = tempLen;
        }
      });
      maxLen += 2;

      return lines
        .map((l) => {
          let str = l.context;
          if (l.desc.length > 0) {
            if (l.context.slice().trim() != "") {
              str = l.context.padEnd(maxLen, " ");
            }
            str += "# " + l.desc;
          }
          return str;
        })
        .join("\n");
    } catch (error) {
      log.error("Invalid YAML string:", error);
    }
  }

  toJSON() {
    let data = {};
    switch (this.type) {
      case macros.Nodetype_Map:
        for (let k in this.childs) {
          let c = this.childs[k];
          data[c.key] = c;
        }
        return data;
      case macros.Nodetype_Sequence:
        if (this.parent.type == macros.Nodetype_Map) {
          return [...this.childs];
        }
        data[this.key] = [...this.childs];
        return data;
      case macros.Nodetype_Value:
        if (this.parent.type == macros.Nodetype_Map) {
          return this.value + (this.desc ? " # " + this.desc : "");
        }
        return (
          (this.key ? this.key + ":" : "") +
          this.value +
          (this.desc ? " # " + this.desc : "")
        );
      case macros.Nodetype_Desc:
        let str = "#" + this.desc;
        if (this.childs.length != 0) {
          for (let k in this.childs) {
            let c = this.childs[k];
            str += "\n" + c.toJSON();
          }
        }
        return str;
    }
    return {
      indent: this.indent,
      type: this.type,
      value: this.key + ":" + this.value,
      childs: this.childs,
    };
  }

  //----------------------------------------------

  getLines(context) {
    // 分行
    if (context.indexOf("\r") !== -1) {
      context = context.split("\r\n").join("\n").split("\r").join("\n");
    }

    let lines = context.split("\n").filter((l) => l.trim() !== "");
    return lines;
  }

  getSpace(lineString) {
    return (lineString.match(/^\s*/) || "")[0];
  }

  getIndent(lineString) {
    // 1 取退格
    let spaceCount = this.getSpace(lineString).length;
    return Math.floor(spaceCount / config.config.indentCount);
  }

  getCurrentLineType(lineString) {
    var trimmedLine = lineString.slice().trim();
    if (trimmedLine.length === 0) return macros.LineTypeEmpty;
    return macros.LineTypeContext;
  }

  parse(context) {
    if (!context || typeof context !== "string") {
      throw new Error("Invalid YAML string");
    }

    let newLines = this.standardLines(this.getLines(context));

    this.parseChildContext(newLines);
  }

  upIndent() {
    this.indent -= 1;
    for (let i in this.childs) {
      this.childs[i].upIndent();
    }
  }
  parseFirstLine(lines) {
    for (let i = 0; i < lines.length; i++) {
      let lineString = lines[i];
      this.parseContent(lineString);
      if (this.key != undefined && this.parent != undefined) {
        this.parent.type = macros.Nodetype_Map;
      }
      break;
    }
    return lines.slice(1);
  }

  parseChildContext(lines) {
    // 解析当前块, 1 一行（同级的都已经放入兄弟结点中了;2 多行，除第一行，都是子节点的; 3 没有空行
    let currentChildNode = undefined;
    let childLines = [];
    let descLines = [];

    for (let i = 0; i < lines.length; i++) {
      let lineString = lines[i];

      let indent = this.getIndent(lineString);

      if (indent <= this.indent) {
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
          let descChildNode = new Node(this, indent);
          descLines = descChildNode.parseFirstLine(descLines); // 处理掉第一条
          if (descChildNode.desc != undefined) {
            descChildNode.parseChildContext(descLines);
            this.childs.push(descChildNode);
          }
          descLines = [];
        }

        currentChildNode = new Node(this, indent);
        childLines.push(lineString);
        continue;
      }

      if (indent == currentChildNode.indent) {
        // 与子节点同级
        childLines = currentChildNode.parseFirstLine(childLines); // 处理掉第一条
        currentChildNode.parseChildContext(childLines); // 解析子节点
        this.childs.push(currentChildNode);

        // 处理注释行
        if (descLines.length > 0) {
          let descChildNode = new Node(this, indent);
          descLines = descChildNode.parseFirstLine(descLines); // 处理掉第一条
          if (descChildNode.desc != undefined) {
            descChildNode.parseChildContext(descLines);
            this.childs.push(descChildNode);
          }
          descLines = [];
        }

        currentChildNode = new Node(this, indent);
        childLines = [];
      }
      if (descLines.length > 0) {
        childLines.push(...descLines); // 处理注释行
      }
      descLines = [];
      childLines.push(lineString);
    }

    if (currentChildNode != undefined) {
      let childLinesWithoutFirst = currentChildNode.parseFirstLine(childLines); // 处理掉第一条
      currentChildNode.parseChildContext(childLinesWithoutFirst); // 解析子节点
      if (currentChildNode.type == macros.Nodetype_Init) {
        log.warn("parse error", childLines);
      } else {
        this.childs.push(currentChildNode);
        childLines = [];
      }
    }
  }

  addCNode() {
    let cNode = undefined;
    switch (this.type) {
      case macros.Nodetype_Sequence:
      case macros.Nodetype_Map:
        cNode = new Node(this, this.indent + 1);
        this.childs.push(cNode);
        break;
      default:
        log.error("no support add node");
    }
    return cNode;
  }

  getLastCNode() {
    let cNode = undefined;

    if (this.childs.length == 0 || this.type == macros.Nodetype_Sequence) {
      cNode = new Node(this, this.indent + 1);
      log.debug("new node -----");
      this.childs.push(cNode);
    }

    if (this.childs.length > 0) {
      cNode = this.childs[this.childs.length - 1];
    }
    return cNode;
  }

  parseContent(lineString) {
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
      this.desc = descContext.trim().slice();
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
      this.type = macros.Nodetype_Desc;
      this.desc = descContext.trim().slice();
      return;
    }

    //-------------------------
    // 数组元素
    if (yamlContext[0] == "-") {
      if (this.parent.type == macros.Nodetype_Init) {
        this.parent.type = macros.Nodetype_Sequence;
      }

      if (this.parent.type != macros.Nodetype_Sequence) {
        log.error("get error node data", yamlContext);
        return;
      }

      yamlContext = yamlContext.slice(1, yamlContext.length).trim(); // '-'不需要了
      let detail = this.parserYamlKVContext(yamlContext);
      if (detail["err"] != undefined) {
        console.warn(detail["err"]);
        return undefined;
      }

      if (detail["key"] == undefined) {
        if (detail["value"] == undefined) {
          return;
        }

        // 只有value
        this.type = macros.Nodetype_Value;
        this.value = detail["value"];
      } else {
        // 有key
        this.type = macros.Nodetype_Map;

        let cNode = this.addCNode();
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
    let detail = this.parserYamlKVContext(yamlContext);
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
      this.type = macros.Nodetype_Value;
      this.value = detail["value"];
      return;
    } else {
      // 这里有key
      if (detail["value"] == undefined) {
        // 没有值
        // 只有key
        this.key = detail["key"];
        return;
      }

      // log.info("kv:", yamlContext, currentNode)
      this.key = detail["key"];
      this.type = macros.Nodetype_Value;
      this.value = detail["value"];
      return;
    }
  }

  parserYamlKVContext(yamlContext) {
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

  //-----------------------------------

  // 查询节点数据
  getNodeData(keypathArray) {
    let currentNode = this;

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
  setNodeData(keypathArray, newNode) {
    if (keypathArray.length == 0 && newNode != undefined) {
      if (newNode.type != undefined && newNode.type != macros.Nodetype_Init)
        this.type = newNode.type;
      if (newNode.key != undefined) this.key = newNode.key;
      if (newNode.desc != undefined) this.desc = newNode.desc;
      if (newNode.value != undefined) this.value = newNode.value;
      this.childs = [...newNode.childs];
      return api_ret.success();
    }

    let currentNode = this.getNodeData(keypathArray.slice(0, -1));
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

  //---------------------------

  compare(node) {
    if (!(node instanceof Node)) {
      throw Error("Cannot compare non Yaml node");
    }

    let diffObjs = [];

    if (this.key != undefined && this.key != node.key) {
      diffObjs.push(
        new diffs.DiffContent(
          diffs.DiffType_more,
          this.getPath().split("."),
          node.toYAMLString().split("\n")
        )
      );
      return diffObjs;
    }

    if (this.type != node.type) {
      diffObjs.push(
        new diffs.DiffContent(
          diffs.DiffType_diff,
          this.getPath().split("."),
          node.toYAMLString().split("\n")
        )
      );
      return diffObjs;
    }

    switch (this.type) {
      case macros.Nodetype_Value:
        if (this.value != node.value) {
          diffObjs.push(
            new diffs.DiffContent(
              diffs.DiffType_diff,
              this.getPath().split("."),
              node.toYAMLString().split("\n")
            )
          );
        }
        break;
      case macros.Nodetype_Desc:
        if (this.desc != node.desc) {
          diffObjs.push(
            new diffs.DiffContent(
              diffs.DiffType_diff,
              this.getPath().split("."),
              node.toYAMLString().split("\n")
            )
          );
        }
        break;
    }

    // 比较子类型
    for (let i = 0; i < this.childs.length; i++) {
      let sCNode = this.childs[i];
      let tCNode = undefined;

      tCNode = getNode(node, sCNode, i);
      if (tCNode == undefined) {
        //
        diffObjs.push(
          new diffs.DiffContent(
            diffs.DiffType_more,
            sCNode.getPath().split("."),
            sCNode.toYAMLString().split("\n")
          )
        );
        continue;
      }

      let tDiffs = sCNode.compare(tCNode);
      diffObjs.push(...tDiffs);
    }

    for (let i = 0; i < node.childs.length; i++) {
      let tCNode = node.childs[i];
      let sCNode = getNode(this, tCNode, i);
      if (sCNode == undefined) {
        //
        diffObjs.push(
          new diffs.DiffContent(
            diffs.DiffType_less,
            tCNode.getPath().split("."),
            tCNode.toYAMLString().split("\n")
          )
        );
        continue;
      }
    }

    return diffObjs;
  }

  //---------------------------------------
  standardLines(lines) {
    let newLines = [];
    for (let i = 0; i < lines.length; i++) {
      let lineString = lines[i];
      // 空行，跳过
      if (this.getCurrentLineType(lineString) == macros.LineTypeEmpty) {
        continue;
      }

      // 如果是注释，需要规整一下
      let tempLineString = lineString.slice();
      if (tempLineString.trim()[0] == "#") {
        // 替换# 到字符串前面
        tempLineString = tempLineString.replace("#", "");

        // 取退格
        let tempIndent = this.getIndent(tempLineString);
        let space = "".padStart(tempIndent * config.config.indentCount, " ");

        lineString = space + "# " + tempLineString.trim();
        // log.debug(lineString + " >>" + tempIndent)
      }

      newLines.push(lineString);
    }
    return newLines;
  }

  async setDesc() {
    let yamlContext = this.toYAMLString();

    let tempNode = new Node();
    let lines = tempNode.getLines(yamlContext);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (
        i == 0 &&
        this.parent != undefined &&
        this.parent.type == macros.Nodetype_Sequence
      ) {
        lines[i] = "# - " + line;
      } else {
        lines[i] = "# " + line;
      }
    }
    let newLines = this.standardLines(lines);

    let tempLines = tempNode.parseFirstLine(newLines); // 处理掉第一条
    tempNode.parseChildContext(tempLines);

    // 转注释节点
    this.type = tempNode.type;
    this.key = tempNode.key;
    this.desc = tempNode.desc;
    this.value = tempNode.value;
    this.childs = [...tempNode.childs];

    return;
  }
  async setDiffs(diffObjs) {
    for (let i in diffObjs) {
      let d = diffObjs[i];

      let tp = undefined;
      let tempLines = [];

      switch (d.type) {
        case diffs.DiffType_more:
          // 多了，转成注释
          tp = this.getNodeData(d.path);
          tp.setDesc();
          break;
        case diffs.DiffType_less:
          // 少，添加
          tp = new Node(undefined, this.indent);
          tempLines = tp.parseFirstLine(d.value); // 处理掉第一条
          tp.parseChildContext(tempLines);
          // this.setNode(d.path, tempNode.root)
          this.setNodeData(d.path, tp);
          break;
        case diffs.DiffType_diff:
          // 不同，修改
          tp = this.getNodeData(d.path);

          let tempNode = new Node(tp.parent, tp.indent, tp.config);
          tempLines = tempNode.parseFirstLine(d.value); // 处理掉第一条
          tempNode.parseChildContext(tempLines);

          tp.type = tempNode.type;
          tp.key = tempNode.key;
          tp.desc = tempNode.desc;
          tp.value = tempNode.value;
          tp.childs = [...tempNode.childs];
          break;
      }
    }
  }
}

function getNode(sourceNode, targetNode, index) {
  // 无key 无value，判断子节点值
  if (targetNode.key == undefined && targetNode.value == undefined) {
    if (index < sourceNode.childs.length) {
      return sourceNode.childs[index];
    }
  }

  switch (sourceNode.type) {
    case macros.Nodetype_Map:
      for (let i in sourceNode.childs) {
        let cNode = sourceNode.childs[i];
        if (cNode.key == targetNode.key) {
          return cNode;
        }
      }
      break;
    case macros.Nodetype_Sequence:
      for (let i in sourceNode.childs) {
        let cNode = sourceNode.childs[i];
        if (targetNode.type != cNode.type) {
          continue;
        }
        if (targetNode.key != undefined) {
          if (cNode.key == targetNode.key && cNode.value == targetNode.value) {
            return cNode;
          }
        } else {
          if (cNode.value == targetNode.value) {
            return cNode;
          }
        }
      }
      break;
  }

  return undefined;
}

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

module.exports = {
  Node,
};
