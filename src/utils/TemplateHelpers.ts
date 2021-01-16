import { camelCase, pascalCase, capitalCase } from "change-case";

/**Helper functions for use in the Hygen templates.*/
export const helpers = {
  camelCase,
  pascalCase,
  capitalCase,
  escape: (str: string) => str.replace(/\n/g, "<br>").replace(/'/g, "’"),
  getDefault: (arg: any) => {
    if (arg.default) return arg.default;
    if (arg.type === "boolean") return false;
    if (arg.type === "number" || arg.type === "integer") return 0;
    return "";
  },
  hasMinMax: (arg: any) => arg.minimum && arg.maximum,
  hasPathParams: (endpoint: string) => endpoint.split("").includes("{"),
  getParams: (params: OperationParameter[], type: "query" | "path") =>
    params.filter((p) => p.in === type).map((p) => p.name),
  toTemplateLiteral: (endpoint: string) => endpoint.replace(/{/g, "${"),
};
