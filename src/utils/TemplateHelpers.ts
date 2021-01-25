import { camelCase, capitalCase, pascalCase } from "change-case";
import { titleCase } from "title-case";

/**Helper functions used in Hygen templates.*/
export const helpers = {
  dividerLength: 0,
  resourceNames: <string[]>[],
  mainParams: <MainParams>{},
  resourceTuples: <[string, Resource][]>[],
  serviceApiRequest: "",

  adjustType: (type: string) => (type === "integer" ? "number" : type),

  camelCase,

  capitalCase,

  escape: (str: string) => str.replace(/\n/g, "<br>").replace(/'/g, "’"),

  pascalCase,

  titleCase,

  storeParams: function (mainParams: MainParams, metaParams: MetaParams) {
    this.mainParams = mainParams;
    this.storeDividerLength(mainParams);
    this.storeResourceTuples(mainParams);
    this.storeResourceNames();
    this.storeServiceApiRequest(metaParams);
  },

  storeResourceTuples: function (mainParams: MainParams) {
    this.resourceTuples = Object.entries(mainParams);
  },

  storeResourceNames: function () {
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
  },

  storeDividerLength: function (mainParams: MainParams) {
    let maxLength = 0;

    Object.entries(mainParams).forEach(([resourceName, operationsArray]) => {
      operationsArray.forEach((operation) => {
        const title = `${resourceName}: ${operation.operationId}`;
        maxLength = title.length > maxLength ? title.length : maxLength;
      });
    });

    this.dividerLength = maxLength + 15;
  },

  storeServiceApiRequest: function (metaParams: MetaParams) {
    this.serviceApiRequest = camelCase(metaParams.serviceName) + "ApiRequest";
  },

  getDefault: function (arg: any) {
    if (arg.default && arg.type === "string") return `'${arg.default}'`;

    // fix inconsistency in OpenAPI source:
    // sometimes a number type gets a string default
    if (
      arg.default &&
      (arg.type === "number" || arg.type === "integer") &&
      typeof arg.default === "string"
    ) {
      return 0;
    }

    if (arg.default) return arg.default;
    if (arg.type === "boolean") return false;
    if (arg.type === "number" || arg.type === "integer") return 0;
    return '""';
  },

  getParams: (params: OperationParameter[], type: "query" | "path") =>
    params.filter((p) => p.in === type).map((p) => p.name),

  hasMinMax: (arg: any) => arg.minimum && arg.maximum,

  hasPathParams: (endpoint: string) => endpoint.split("").includes("{"),

  isFirst: (item: any, arr: any[]) => arr.indexOf(item) === 0,

  isLast: (item: any, arr: any[]) => arr.indexOf(item) + 1 === arr.length,

  makeResourceBranch: function (resourceName: string) {
    const branch = `if (resource === '${this.camelCase(resourceName)}') {`;
    const prefix = "} else ";

    const isFirst = this.isFirst(resourceName, this.resourceNames);

    return isFirst ? branch : prefix + branch;
  },

  makeOperationBranch: function (operation: Operation, resourceName: string) {
    const { operationId } = operation;
    const branch = `if (operation === '${this.camelCase(operationId)}') {`;
    const prefix = "} else ";

    const isFirst = this.isFirst(operation, this.mainParams[resourceName]);

    return isFirst ? branch : prefix + branch;
  },

  makeHeader: function (header: string) {
    const padLength = Math.floor((this.dividerLength - header.length) / 2);
    const headerLine = "// " + " ".repeat(padLength) + header;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, headerLine, dividerLine].join("\n" + "\t".repeat(3));
  },

  makeDivider: function (resourceName: string, operationId: string) {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((this.dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  },

  toTemplateLiteral: (endpoint: string) => endpoint.replace(/{/g, "${"),
};
