const resource = require("../../../src/input/Resource.json");
const helper = require("../../../dist/utils/TemplateHelper");
const builder = require("../../../dist/utils/TemplateBuilder");

module.exports = {
  params: () => ({ ...resource, ...helper, ...builder }),
};
