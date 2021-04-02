const nodegenParams = require("../../../src/input/_nodegenParams.json");
const { pascalCase } = require("change-case");

const resourceNames = Object.keys(nodegenParams.mainParams).map(resourceName => pascalCase(resourceName));

module.exports = {
  params: () => ({ resourceNames })
};
