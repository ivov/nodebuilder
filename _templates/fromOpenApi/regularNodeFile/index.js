const nodegenParams = require("../../../src/input/_nodegenParams.json");
const helper = require("../../../dist/utils/TemplateHelper");
const { Builder } = require("../../../dist/utils/TemplateBuilder");

module.exports = {
  params: () => ({ ...nodegenParams, ...helper, Builder })
};
