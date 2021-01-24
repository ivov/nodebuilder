const resource = require("../../../src/input/Resource.json");
const helpers = require("../../../dist/src/utils/TemplateHelpers");

module.exports = {
  params: () => ({ ...resource, ...helpers }),
};
