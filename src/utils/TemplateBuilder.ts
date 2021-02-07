import { camelCase } from "change-case";
import { ApiCallBuilder } from "./ApiCallBuilder";
import { DividerBuilder } from "./DividerBuilder";
import { BranchBuilder } from "./BranchBuilder";

export const builder = {
  mainParams: <MainParams>{},
  resourceTuples: <[string, Resource][]>[],
  resourceNames: <string[]>[],
  serviceApiRequest: "",

  apiCallBuilder: <any>{}, // TODO
  dividerBuilder: <any>{}, // TODO
  branchBuilder: <any>{}, // TODO

  constructor: function (mainParams: MainParams, { serviceName }: MetaParams) {
    this.mainParams = mainParams;
    this.resourceTuples = Object.entries(this.mainParams);
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
    this.serviceApiRequest = camelCase(serviceName) + "ApiRequest";

    this.apiCallBuilder = ApiCallBuilder.constructor(this.serviceApiRequest);
    this.dividerBuilder = DividerBuilder.constructor(this.resourceTuples);
    this.branchBuilder = BranchBuilder.constructor(mainParams);
  },

  // apiCall ------------------

  apiCall: function (operation: Operation) {
    return ApiCallBuilder.run(operation);
  },

  // divider ------------------

  resourceDivider: function (resourceName: string) {
    return this.dividerBuilder.resourceDivider(resourceName);
  },

  operationDivider: function (resourceName: string, operationId: string) {
    return this.dividerBuilder.operationDivider(resourceName, operationId);
  },

  // branch ------------------

  resourceBranch: function (resourceName: string) {
    return this.branchBuilder.resourceBranch(resourceName);
  },

  operationBranch: function (resourceName: string, operation: Operation) {
    return this.branchBuilder.operationBranch(resourceName, operation);
  },

  resourceError: function (resourceName: string) {
    return this.branchBuilder.resourceError(resourceName);
  },

  operationError: function (operation: Operation, resourceName: string) {
    return this.branchBuilder.operationError(operation, resourceName);
  },
};
