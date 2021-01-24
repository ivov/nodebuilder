const nodegenParams = require("../../../src/input/nodegenParams.json");
const helpers = require("../../../dist/utils/TemplateHelpers");

module.exports = {
  params: () => ({ ...nodegenParams, ...helpers })
};
