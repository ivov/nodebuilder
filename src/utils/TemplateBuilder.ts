import { camelCase } from "change-case";
import { ApiCallBuilder } from "./ApiCallBuilder";
import { DividerBuilder } from "./DividerBuilder";
import { BranchBuilder } from "./BranchBuilder";

export const builder = {
  resourceTuples: <ResourceTuples>[],
  resourceNames: <string[]>[],
  serviceApiRequest: "",

  apiCallBuilder: <ApiCallBuilder>{},
  dividerBuilder: <DividerBuilder>{},
  branchBuilder: <BranchBuilder>{},

  constructor: function (mainParams: MainParams, { serviceName }: MetaParams) {
    this.resourceTuples = Object.entries(mainParams);
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
    this.serviceApiRequest = camelCase(serviceName) + "ApiRequest";

    this.apiCallBuilder = new ApiCallBuilder(this.serviceApiRequest);
    this.dividerBuilder = new DividerBuilder(this.resourceTuples);
    this.branchBuilder = new BranchBuilder(mainParams);
  },

  // ApiCallBuilder ------------------

  apiCall: function (operation: Operation) {
    return this.apiCallBuilder.run(operation);
  },

  // DividerBuilder ------------------

  resourceDivider: function (resourceName: string) {
    return this.dividerBuilder.resourceDivider(resourceName);
  },

  operationDivider: function (resourceName: string, operationId: string) {
    return this.dividerBuilder.operationDivider(resourceName, operationId);
  },

  // BranchBuilder ------------------

  resourceBranch: function (resourceName: string) {
    return this.branchBuilder.resourceBranch(resourceName);
  },

  operationBranch: function (resourceName: string, operation: Operation) {
    return this.branchBuilder.operationBranch(resourceName, operation);
  },

  resourceError: function (resourceName: string) {
    return this.branchBuilder.resourceError(resourceName);
  },

  operationError: function (resourceName: string, operation: Operation) {
    return this.branchBuilder.operationError(resourceName, operation);
  },
};
