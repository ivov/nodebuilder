const templateData = require("../../../src/output/nodegenParams.json");
templateData.helpers = require("../../../dist/utils/helpers").default;

module.exports = {
  params: () => templateData,
};
