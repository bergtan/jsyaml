const path = require("path");
const yaml = require("..");

test("diffs", function () {
  let n = yaml.parseFile(path.join(__dirname, "tmp.yaml"));

  expect(n.toObject()).toEqual({
    env: { node: 'true', mocha: 'true', es6: 'true' },
    parserOptions: { ecmaVersion: '2020' },
    rules: { 'no-undefined': '0' }
  });

  yaml.saveFile(path.join(__dirname, "tmp2.yaml"), n);
});
