class Config {
  constructor() {
    this.indentCount = 2;
  }

  withIndent(count) {
    if (count != this.indentCount) {
      this.indentCount = count;
    }
  }
}

module.exports.config = new Config(); 
