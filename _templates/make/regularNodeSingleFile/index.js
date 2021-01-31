const nodegenParams = require("../../../src/input/nodegenParams.json");
const helper = require("../../../dist/utils/TemplateHelper");
const builder = require("../../../dist/utils/TemplateBuilder");

module.exports = {
  params: () => ({ ...nodegenParams, ...helper, ...builder })
};
