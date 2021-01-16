const resource = require("../../../src/input/Resource.json");
const helpers = require("../../../dist/utils/TemplateHelpers");

module.exports = {
  params: () => ({ ...resource, ...helpers }),
};
