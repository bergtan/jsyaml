const diffs = require("../lib/diffs");
const path = require("path");
const yaml = require("..");

test("diffs", function () {
  let n = yaml.parseFile(path.join(__dirname, "tmp.yaml"));
  let n1 = yaml.parseFile(path.join(__dirname, "tmp_1.yaml"));

  let diffsContent = diffs.compare(n, n1);

  diffsContent.forEach((diff) => {
    switch (diff.type) {
      case diffs.DiffType_more:
        expect(diff.value).toEqual(["no-undefined: 0"]);
        break;
      case diffs.DiffType_less:
        expect(diff.value).toEqual(["no-undefined1: 0"]);
        break;
      case diffs.DiffType_diff:
        break;
      default:
        throw new Error("unknow diff type");
    }
  });

  diffs.setDiffs(n, diffsContent);
  expect(n.toObject()).toEqual(n1.toObject());
});
