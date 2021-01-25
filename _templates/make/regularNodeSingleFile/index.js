const nodegenParams = require("../../../src/input/nodegenParams.json");
const helpers = require("../../../dist/utils/TemplateHelpers");
const builders = require("../../../dist/utils/TemplateBuilders");

module.exports = {
  params: () => ({ ...nodegenParams, ...helpers, ...builders })
};
