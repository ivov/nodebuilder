import { camelCase } from "change-case";

export const BranchBuilder = {
  mainParams: <MainParams>{},
  resourceTuples: <[string, Resource][]>[],
  resourceNames: <string[]>[],

  constructor: function (mainParams: MainParams) {
    this.mainParams = mainParams;
    this.resourceTuples = Object.entries(this.mainParams);
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
    return this;
  },

  isFirst: <T>(item: T, array: T[]) => array.indexOf(item) === 0,

  isLast: <T>(item: T, array: T[]) => array.indexOf(item) + 1 === array.length,

  resourceBranch: function (resourceName: string) {
    const branch = `if (resource === '${camelCase(resourceName)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(resourceName, this.resourceNames);

    return isFirst ? branch : prefix + branch;
  },

  operationBranch: function (resourceName: string, operation: Operation) {
    const branch = `if (operation === '${camelCase(operation.operationId)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(operation, this.mainParams[resourceName]);

    return isFirst ? branch : prefix + branch;
  },

  resourceError: function (resourceName: string) {
    const isLast = this.isLast(resourceName, this.resourceNames);
    const resourceError = `
    \t} else {
    \t\tthrow new Error(\`Unknown resource: \${resource}\`);
    \t}`;

    return isLast ? resourceError : null;
  },

  operationError: function (resourceName: string, operation: Operation) {
    const isLast = this.isLast(operation, this.mainParams[resourceName]);
    const operationError = `
    \t\t} else {
    \t\t\tthrow new Error(\`Unknown operation: \${operation}\`);
    \t\t}`;

    return isLast ? operationError : null;
  },
};
