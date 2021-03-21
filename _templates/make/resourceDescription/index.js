const resource = require("../../../src/input/_resource.json");
const nodegenParams = require("../../../src/input/_nodegenParams.json");
const { Helper } = require("../../../dist/services/TemplateHelper");
const { Builder } = require("../../../dist/services/TemplateBuilder");
const { pascalCase } = require("change-case"); // separately for file path generation

module.exports = {
  params: () => ({ ...resource, Helper, Builder, pascalCase, ...nodegenParams }),
};
