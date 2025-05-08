const yamlnode = require("./node.js");
const macros = require("./macros.js");
const option = require("./option.js");
const parse_node = require("./parse_node.js");

const DiffType_more = 0; // 比目标多
const DiffType_less = 1; // 比目标少
const DiffType_diff = 2; // 值不同

class DiffContent {
  constructor(type, path, value) {
    this.type = type;
    this.path = path;
    this.value = value;
  }
}

function setDiffs(node, diffObjs) {
  for (let i in diffObjs) {
    let d = diffObjs[i];

    let tp = undefined;
    let tempLines = [];

    switch (d.type) {
      case DiffType_more:
        // 多了，转成注释
        tp = option.getNode(node, d.path);
        option.setDesc(tp);
        break;
      case DiffType_less:
        // 少，添加
        tp = new yamlnode.Node(undefined, node.indent);
        tempLines = parse_node.parseFirstLine(tp, d.value); // 处理掉第一条
        parse_node.parseChildContext(tp, tempLines);
        // node.setNode(d.path, tempNode.root)
        option.setNodeData(node, d.path, tp);
        break;
      case DiffType_diff:
        // 不同，修改
        tp = option.getNode(node, d.path);

        let tempNode = new yamlnode.Node(tp.parent, tp.indent, tp.config);
        tempLines = parse_node.parseFirstLine(tempNode, d.value); // 处理掉第一条
        parse_node.parseChildContext(tempNode, tempLines);

        tp.type = tempNode.type;
        tp.key = tempNode.key;
        tp.desc = tempNode.desc;
        tp.value = tempNode.value;
        tp.childs = [...tempNode.childs];
        break;
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

function compare(source, target) {
  if (
    !(source instanceof yamlnode.Node) ||
    !(target instanceof yamlnode.Node)
  ) {
    throw Error("Cannot compare non Yaml node");
  }

  let diffObjs = [];

  if (source.key != undefined && source.key != target.key) {
    diffObjs.push(
      new DiffContent(
        DiffType_more,
        source.getPath().split("."),
        target.toYAMLString().split("\n")
      )
    );
    return diffObjs;
  }

  if (source.type != target.type) {
    diffObjs.push(
      new DiffContent(
        DiffType_diff,
        source.getPath().split("."),
        target.toYAMLString().split("\n")
      )
    );
    return diffObjs;
  }

  switch (source.type) {
    case macros.Nodetype_Value:
      if (source.value != target.value) {
        diffObjs.push(
          new DiffContent(
            DiffType_diff,
            source.getPath().split("."),
            target.toYAMLString().split("\n")
          )
        );
      }
      break;
    case macros.Nodetype_Desc:
      if (source.desc != target.desc) {
        diffObjs.push(
          new DiffContent(
            DiffType_diff,
            source.getPath().split("."),
            target.toYAMLString().split("\n")
          )
        );
      }
      break;
  }

  // 比较子类型
  for (let i = 0; i < source.childs.length; i++) {
    let sCNode = source.childs[i];
    let tCNode = undefined;

    tCNode = getNode(target, sCNode, i);
    if (tCNode == undefined) {
      //
      diffObjs.push(
        new DiffContent(
          DiffType_more,
          sCNode.getPath().split("."),
          sCNode.toYAMLString().split("\n")
        )
      );
      continue;
    }

    let tDiffs = compare(sCNode, tCNode);
    diffObjs.push(...tDiffs);
  }

  for (let i = 0; i < target.childs.length; i++) {
    let tCNode = target.childs[i];
    let sCNode = getNode(source, tCNode, i);
    if (sCNode == undefined) {
      //
      diffObjs.push(
        new DiffContent(
          DiffType_less,
          tCNode.getPath().split("."),
          tCNode.toYAMLString().split("\n")
        )
      );
      continue;
    }
  }

  return diffObjs;
}

module.exports.DiffType_more = DiffType_more;
module.exports.DiffType_less = DiffType_less;
module.exports.DiffType_diff = DiffType_diff;
module.exports.DiffContent = DiffContent;

module.exports.setDiffs = setDiffs;
module.exports.compare = compare;
