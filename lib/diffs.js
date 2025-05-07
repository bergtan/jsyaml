const DiffType_more = 0 // 比目标多 
const DiffType_less = 1 // 比目标少
const DiffType_diff = 2 // 值不同

class DiffContent {
    constructor(type, path, value) {
        this.type = type
        this.path = path
        this.value = value
    };
}


module.exports = {
    DiffType_more,
    DiffType_less,
    DiffType_diff,

    DiffContent,
};