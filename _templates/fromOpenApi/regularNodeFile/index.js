const nodegenParams = require("../../../src/input/_nodegenParams.json");
const { Helper } = require("../../../dist/utils/TemplateHelper");
const { Builder } = require("../../../dist/utils/TemplateBuilder");
const { pascalCase } = require("change-case"); // for file path generation

module.exports = {
  params: () => ({ ...nodegenParams, Helper, Builder, pascalCase })
};
