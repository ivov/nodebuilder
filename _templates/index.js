const nodegenParams = require("../src/output/nodegenParams.json");
const resource = require("../src/output/resources/Resource.json");
const helpers = require("../dist/utils/helpers").default;

module.exports = {
  regularNodeSingleFile: { ...nodegenParams, helpers },
  resourceDescription: { ...resource, helpers },
};
