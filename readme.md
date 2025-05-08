Installation
------------

### YAML module for node.js

```
npm install yaml-proxy
```

API
---
### `parse(str)`
``` javascript
const yaml = require('yaml-proxy');
const fs   = require('fs');

// Get document, or throw exception on error
try {
  const yamlObj = yaml.parse(fs.readFileSync('example.yml', 'utf8'));
  console.log(yamlObj);
} catch (e) {
  console.log(e);
}
```


### `parseObjct(object)`
``` javascript
const yaml = require('yaml-proxy');
const fs   = require('fs');

// Get object, or throw exception on error
try {
  const yamlObj = yaml.parseObjct({a:1, b:2});
  console.log(yamlObj);
} catch (e) {
  console.log(e);
}
```
### `parseFile(str)`
``` javascript
const yaml = require('yaml-proxy');
const fs   = require('fs');

// Get file path, or throw exception on error
try {
  const yamlObj = yaml.parseFile('example.yml');
  console.log(yamlObj);
} catch (e) {
  console.log(e);
}
```

### `saveFile(str, yamlObj)`
``` javascript
const yaml = require('yaml-proxy');
const fs   = require('fs');

// Get file path, or throw exception on error
try {
  const yamlObj = yaml.parseObjct({a:1, b:2});
  yaml.saveFile("out.yaml", yamlObj);
} catch (e) {
  console.log(e);
}
```
### `string(yamlObj)`
``` javascript
const yaml = require('yaml-proxy');
const fs   = require('fs');

// Get file path, or throw exception on error
try {
  const yamlObj = yaml.parseObjct({a:1, b:2});
  const doc = yaml.string(yamlObj);
  console.log(doc)
} catch (e) {
  console.log(e);
}