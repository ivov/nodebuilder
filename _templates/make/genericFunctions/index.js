const nodegenParams = require("../../../src/input/_nodegenParams.json");
const { Helper } = require("../../../dist/services/TemplateHelper");

module.exports = {
  params: () => ({ ...nodegenParams, Helper })
};
