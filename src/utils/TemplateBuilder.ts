import { camelCase } from "change-case";
import {
  ApiCallBuilder,
  ApiCallBuilderFromOpenAPI,
  ApiCallBuilderFromYAML,
} from "./ApiCallBuilder";
import { DividerBuilder } from "./DividerBuilder";
import { BranchBuilder } from "./BranchBuilder";

export class Builder {
  resourceTuples: ResourceTuples;
  resourceNames: string[];
  serviceApiRequest: string;

  source: GenerationSource;

  apiCallBuilder: ApiCallBuilder;
  dividerBuilder: DividerBuilder;
  branchBuilder: BranchBuilder;

  constructor(
    mainParams: MainParams,
    { serviceName }: MetaParams,
    source: GenerationSource
  ) {
    this.resourceTuples = Object.entries(mainParams);
    this.resourceNames = Object.keys(mainParams);
    this.serviceApiRequest = camelCase(serviceName) + "ApiRequest";

    this.apiCallBuilder =
      source === "OpenAPI"
        ? new ApiCallBuilderFromOpenAPI(this.serviceApiRequest)
        : new ApiCallBuilderFromYAML(this.serviceApiRequest);

    this.dividerBuilder = new DividerBuilder();
    this.branchBuilder = new BranchBuilder(mainParams);
  }

  // ApiCallBuilder ------------------

  apiCall(operation: Operation) {
    return this.apiCallBuilder.run(operation);
  }

  // DividerBuilder ------------------

  resourceDivider(resourceName: string) {
    return this.dividerBuilder.resourceDivider(resourceName);
  }

  operationDivider(resourceName: string, operationId: string) {
    return this.dividerBuilder.operationDivider(resourceName, operationId);
  }

  // BranchBuilder ------------------

  resourceBranch(resourceName: string) {
    return this.branchBuilder.resourceBranch(resourceName);
  }

  operationBranch(resourceName: string, operation: Operation) {
    return this.branchBuilder.operationBranch(resourceName, operation);
  }

  resourceError(resourceName: string) {
    return this.branchBuilder.resourceError(resourceName);
  }

  operationError(resourceName: string, operation: Operation) {
    return this.branchBuilder.operationError(resourceName, operation);
  }
}
