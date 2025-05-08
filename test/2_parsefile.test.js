const path = require("path");
const fs = require("fs");
const yaml = require("..");

test("parseFile", function () {
  const yamlFile = path.join(__dirname, "tmp.yaml")
  let tempData = fs.readFileSync(yamlFile, "utf-8");

  let n = yaml.parseFile(yamlFile);
  expect(yaml.string(n)).toBe(tempData);
});
