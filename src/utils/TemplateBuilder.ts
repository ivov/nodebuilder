import { camelCase } from "change-case";

/**Builder functions for Hygen templates.*/
export const builder = {
  mainParams: <MainParams>{},
  metaParams: <MetaParams>{},
  dividerLength: 0,
  serviceApiRequest: "",

  constructor: function (mainParams: MainParams, metaParams: MetaParams) {
    this.mainParams = mainParams;
    this.metaParams = metaParams;
    this.dividerLength = this.getDividerLength();
  },

  getResourceTuples: function () {
    return Object.entries(this.mainParams);
  },

  getResourceNames: function () {
    return this.getResourceTuples().map((tuple) => tuple[0]);
  },

  getDividerLength: function () {
    let maxLength = 0;

    this.getResourceTuples().forEach(([resourceName, operationsArray]) => {
      operationsArray.forEach((operation) => {
        const title = `${resourceName}: ${operation.operationId}`;
        maxLength = title.length > maxLength ? title.length : maxLength;
      });
    });

    return maxLength + 15;
  },

  buildServiceApiRequest: function () {
    return camelCase(this.metaParams.serviceName) + "ApiRequest";
  },

  isFirst: (item: any, arr: any[]) => arr.indexOf(item) === 0,

  isLast: (item: any, arr: any[]) => arr.indexOf(item) + 1 === arr.length,

  buildResourceBranch: function (resourceName: string) {
    const branch = `if (resource === '${camelCase(resourceName)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(resourceName, this.getResourceNames());

    return isFirst ? branch : prefix + branch;
  },

  buildOperationBranch: function (operation: Operation, resourceName: string) {
    const { operationId } = operation;
    const branch = `if (operation === '${camelCase(operationId)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(operation, this.mainParams[resourceName]);

    return isFirst ? branch : prefix + branch;
  },

  buildHeader: function (header: string) {
    const padLength = Math.floor((this.dividerLength - header.length) / 2);
    const headerLine = "// " + " ".repeat(padLength) + header;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, headerLine, dividerLine].join("\n" + "\t".repeat(3));
  },

  buildDivider: function (resourceName: string, operationId: string) {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((this.dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  },

  buildResourceError: function (resourceName: string) {
    const isLast = this.isLast(resourceName, this.getResourceNames());
    const resourceError = `
    \t} else {
    \t\tthrow new Error(\`Unknown resource: \${resource}\`);
    \t}`;

    return isLast ? resourceError : null;
  },

  buildOperationError: function (operation: Operation, resourceName: string) {
    const isLast = this.isLast(operation, this.mainParams[resourceName]);
    const operationError = `
    \t\t} else {
    \t\t\tthrow new Error(\`Unknown operation: \${operation}\`);
    \t\t}`;

    return isLast ? operationError : null;
  },
};
