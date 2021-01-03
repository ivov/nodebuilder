const templateData = require("../../../src/output/temp/Resource.json");
templateData.helpers = require("../../../dist/utils/helpers").default;

module.exports = {
  params: () => templateData,
};
