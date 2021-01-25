import { camelCase, capitalCase, pascalCase } from "change-case";
import { titleCase } from "title-case";

/**Helper functions for Hygen templates.*/
export const helpers = {
  adjustType: (type: string) => (type === "integer" ? "number" : type),

  camelCase,

  capitalCase,

  escape: (str: string) => str.replace(/\n/g, "<br>").replace(/'/g, "’"),

  pascalCase,

  titleCase: (str: string) => titleCase(str.replace(".", " ")),

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

  isLast: (item: any, arr: any[]) => arr.indexOf(item) + 1 === arr.length,

  toTemplateLiteral: (endpoint: string) => endpoint.replace(/{/g, "${"),
};
