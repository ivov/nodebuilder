const resource = require("../../../src/input/_resource.json");
const { Helper } = require("../../../dist/services/TemplateHelper");
const { pascalCase } = require("change-case"); // separately for file path generation

module.exports = {
  params: () => ({ ...resource, Helper, pascalCase }),
};
