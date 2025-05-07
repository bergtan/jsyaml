const yamlnode = require("./node.js")

function saveFile(file, yamlObj) {
  if (!(yamlObj instanceof yamlnode.Node)) {
    throw Error("yaml obj type error");
  }

  let d = yamlObj.toYAMLString();
  fs.writeFileSync(file, d);
}

function string(yamlObj) {
  if (!(yamlObj instanceof yamlnode.Node)) {
    throw Error("yaml obj type error");
  }

  return yamlObj.toYAMLString();
}

module.exports.saveFile = saveFile;
module.exports.string = string;
