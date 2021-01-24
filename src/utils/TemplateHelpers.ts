import { camelCase, pascalCase, capitalCase } from "change-case";
import { title } from "process";

/**Helper functions used in Hygen templates.*/
export const helpers = {
  camelCase,

  capitalCase,

  escape: (str: string) => str.replace(/\n/g, "<br>").replace(/'/g, "’"),

  pascalCase,

  getDefault: (arg: any) => {
    if (arg.default) return arg.default;
    if (arg.type === "boolean") return false;
    if (arg.type === "number" || arg.type === "integer") return 0;
    return "";
  },

  getServiceApiRequest: (metaParams: MetaParams) =>
    camelCase(metaParams.serviceName) + "ApiRequest",

  getParams: (params: OperationParameter[], type: "query" | "path") =>
    params.filter((p) => p.in === type).map((p) => p.name),

  hasMinMax: (arg: any) => arg.minimum && arg.maximum,

  hasPathParams: (endpoint: string) => endpoint.split("").includes("{"),

  isFirst: (item: any, arr: any[]) => arr.indexOf(item) === 0,

  isLast: (item: any, arr: any[]) => arr.indexOf(item) + 1 === arr.length,

  makeHeader: (header: string, dividerLength: number) => {
    const padLength = Math.floor((dividerLength - header.length) / 2);
    const headerLine = "// " + " ".repeat(padLength) + header;
    const dividerLine = "// " + "-".repeat(dividerLength);

    return [dividerLine, headerLine, dividerLine].join("\n" + "\t".repeat(3));
  },

  makeDivider: (
    resourceName: string,
    operationId: string,
    dividerLength: number
  ) => {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  },

  getResourceNames: (resourceTuples: [string, Operation[]]) =>
    resourceTuples.map((tuple) => tuple[0]),

  getDividerLength: (mainParams: MainParams) => {
    let maxLength = 0;

    Object.entries(mainParams).forEach(([resourceName, operationsArray]) => {
      operationsArray.forEach((operation) => {
        const title = `${resourceName}: ${operation.operationId}`;
        maxLength = title.length > maxLength ? title.length : maxLength;
      });
    });

    return maxLength + 15;
  },

  toTemplateLiteral: (endpoint: string) => endpoint.replace(/{/g, "${"),
};
