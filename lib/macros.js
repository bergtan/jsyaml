const LineTypeEmpty = 0 // 空行
const LineTypeDesc = 1 // 注释
const LineTypeContext = 2 // 内容行

const Nodetype_Init = 0 // 初始化
const Nodetype_Desc = 1 // 注释 注释行、注释块
const Nodetype_Sequence = 2 // 数组
const Nodetype_Map = 3 // map
const Nodetype_Value = 4 // 数据 int、str等基础数据

module.exports = {
    LineTypeEmpty,
    LineTypeDesc,
    LineTypeContext,
    Nodetype_Init,
    Nodetype_Desc,
    Nodetype_Sequence,
    Nodetype_Map,
    Nodetype_Value,
}