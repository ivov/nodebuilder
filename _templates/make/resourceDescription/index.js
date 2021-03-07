const resource = require("../../../src/input/_resource.json");
const { Helper } = require("../../../dist/utils/TemplateHelper");
const { pascalCase } = require("change-case"); // for file path generation

module.exports = {
  params: () => ({ ...resource, Helper, pascalCase }),
};
