import { camelCase } from "change-case";

/**Builder functions for Hygen templates.*/
export const builder = {
  mainParams: <MainParams>{},
  dividerLength: 0,
  resourceTuples: <[string, Resource][]>[],
  resourceNames: <string[]>[],
  serviceApiRequest: "",

  constructor: function (mainParams: MainParams, { serviceName }: MetaParams) {
    this.mainParams = mainParams;
    this.resourceTuples = Object.entries(this.mainParams);
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
    this.dividerLength = this.getDividerLength();
    this.serviceApiRequest = camelCase(serviceName) + "ApiRequest";
  },

  getDividerLength: function () {
    let maxLength = 0;

    this.resourceTuples.forEach(([resourceName, operationsArray]) => {
      operationsArray.forEach((operation) => {
        const title = `${resourceName}: ${operation.operationId}`;
        maxLength = title.length > maxLength ? title.length : maxLength;
      });
    });

    return maxLength + 15;
  },

  isFirst: <T>(item: T, array: T[]) => array.indexOf(item) === 0,

  isLast: <T>(item: T, array: T[]) => array.indexOf(item) + 1 === array.length,

  /** Build a resource branch, either the first:
   * ```
   * if (resource === 'user') {
   * ```
   * Or subsequent branches:
   * ```
   * } else if (resource === 'user') {
   * ```*/
  buildResourceBranch: function (resourceName: string) {
    const branch = `if (resource === '${camelCase(resourceName)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(resourceName, this.resourceNames);

    return isFirst ? branch : prefix + branch;
  },

  /** Build an operation branch, either the first:
   * ```
   * if (operation === 'player') {
   * ```
   * Or subsequent branches:
   * ```
   * } else if (operation === 'player') {
   * ```*/
  buildOperationBranch: function (operation: Operation, resourceName: string) {
    const branch = `if (operation === '${camelCase(operation.operationId)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(operation, this.mainParams[resourceName]);

    return isFirst ? branch : prefix + branch;
  },

  /** Build a header for all resources, operations or fields:
   * ```
   * // --------------------------------------------------------------
   * //                             Fields
   * // --------------------------------------------------------------
   * ```
   */
  buildHeader: function (header: string) {
    const padLength = Math.floor((this.dividerLength - header.length) / 2);
    const headerLine = "// " + " ".repeat(padLength) + header;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, headerLine, dividerLine].join("\n" + "\t".repeat(3));
  },

  /**  Build a divider for an individual operation:
   * ```
   * // --------------------------------------------------------------
   * //                         user: getUser
   * // --------------------------------------------------------------
   * ```
   */
  buildDivider: function (resourceName: string, operationId: string) {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((this.dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  },

  /** Build the error branch for resources:
   * ```
   * } else {
   *     throw new Error(`Unknown resource: ${resource}`);
   * }
   * ```*/
  buildResourceError: function (resourceName: string) {
    const isLast = this.isLast(resourceName, this.resourceNames);
    const resourceError = `
    \t} else {
    \t\tthrow new Error(\`Unknown resource: \${resource}\`);
    \t}`;

    return isLast ? resourceError : null;
  },

  /** Build the error branch for operations:
   * ```
   * } else {
   *     throw new Error(`Unknown operation: ${operation}`);
   * }
   * ```*/
  buildOperationError: function (operation: Operation, resourceName: string) {
    const isLast = this.isLast(operation, this.mainParams[resourceName]);
    const operationError = `
    \t\t} else {
    \t\t\tthrow new Error(\`Unknown operation: \${operation}\`);
    \t\t}`;

    return isLast ? operationError : null;
  },
};
