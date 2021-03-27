import { camelCase } from "change-case";
import ApiCallBuilder from "./templating/ApiCallBuilder";
import DividerBuilder from "./templating/DividerBuilder";
import BranchBuilder from "./templating/BranchBuilder";
import ImportsBuilder from "./templating/ImportsBuilder";
import ResourceBuilder from "./templating/ResourceBuilder";

export class Builder {
  resourceTuples: ResourceTuples;
  resourceNames: string[];
  apiRequest: string;

  apiCallBuilder: ApiCallBuilder;
  branchBuilder: BranchBuilder;
  dividerBuilder: DividerBuilder;
  importsBuilder: ImportsBuilder;
  resourceBuilder: ResourceBuilder;

  constructor(mainParams: MainParams, { serviceName }: MetaParams) {
    this.resourceTuples = Object.entries(mainParams);
    this.resourceNames = Object.keys(mainParams);
    this.apiRequest = camelCase(serviceName) + "ApiRequest";

    this.apiCallBuilder = new ApiCallBuilder(this.apiRequest);
    this.branchBuilder = new BranchBuilder(mainParams);
    this.dividerBuilder = new DividerBuilder();
    this.importsBuilder = new ImportsBuilder(this.apiRequest, mainParams);
    this.resourceBuilder = new ResourceBuilder();
  }

  // ApiCallBuilder

  apiCall(operation: Operation) {
    return this.apiCallBuilder.run(operation);
  }

  // BranchBuilder

  resourceBranch(resourceName: string) {
    return this.branchBuilder.resourceBranch(resourceName);
  }

  operationBranch(resourceName: string, operation: Operation) {
    return this.branchBuilder.operationBranch(resourceName, operation);
  }

  resourceError(
    resourceName: string,
    options: { enabled: boolean } = { enabled: false }
  ) {
    return this.branchBuilder.resourceError(resourceName, options);
  }

  operationError(
    resourceName: string,
    operation: Operation,
    options: { enabled: boolean } = { enabled: false }
  ) {
    return this.branchBuilder.operationError(resourceName, operation, options);
  }

  // ImportsBuilder

  genericFunctionsImports() {
    return this.importsBuilder.genericFunctionsImports();
  }

  // DividerBuilder

  resourceDivider(resourceName: string) {
    return this.dividerBuilder.resourceDivider(resourceName);
  }

  operationDivider(
    resourceName: string,
    operationId: string,
    operationUrl: string
  ) {
    return this.dividerBuilder.operationDivider(
      resourceName,
      operationId,
      operationUrl
    );
  }

  resourceDescriptionDivider(resourceName: string, operationId: string) {
    return this.dividerBuilder.resourceDescriptionDivider(
      resourceName,
      operationId
    );
  }

  // ResourceBuilder

  operationsOptions(operations: Operation[]) {
    return this.resourceBuilder.operationsOptions(operations);
  }

  getAllAdditions(resourceName: string, operationId: string) {
    return this.resourceBuilder.getAllAdditions(resourceName, operationId);
  }
}
