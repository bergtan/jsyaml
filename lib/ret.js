module.exports = {
    fail(msg) {
        return { ret: -1, message: msg }
    },
    success(data) {
        if (data == undefined || !data) {
            data = {}
        }
        return Object.assign({}, { ret: 0, message: "操作成功" }, data)
    },
}
