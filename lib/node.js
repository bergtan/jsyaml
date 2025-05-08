const config = require("./config.js");
const macros = require("./macros.js");

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
          if (c.type == macros.Nodetype_Desc) continue;
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

  upIndent() {
    this.indent -= 1;
    for (let i in this.childs) {
      this.childs[i].upIndent();
    }
  }
}

module.exports.Node = Node;
