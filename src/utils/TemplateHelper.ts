import { camelCase, capitalCase, pascalCase } from "change-case";
import { titleCase } from "title-case";

export class Helper {
  adjustType(type: string) {
    type === "integer" ? "number" : type;
  }

  camelCase(str: string) {
    return camelCase(str);
  }

  capitalCase(str: string) {
    return capitalCase(str);
  }

  pascalCase(str: string) {
    return pascalCase(str);
  }

  titleCase(str: string) {
    titleCase(str.replace(".", " "));
  }

  escape(str: string) {
    str.replace(/(\r)?\n/g, "<br>").replace(/'/g, "’");
  }

  getDefault(arg: any) {
    if (arg.default && arg.type === "string") return `'${arg.default}'`;

    // edge case: number type with string default (third-party error)
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
  }

  getParams(params: OperationParameter[], type: "query" | "path") {
    return params.filter((p) => p.in === type).map((p) => p.name);
  }

  hasMinMax(arg: any) {
    return arg.minimum && arg.maximum;
  }

  hasPathParams(endpoint: string) {
    return endpoint.split("").includes("{");
  }

  toTemplateLiteral(endpoint: string) {
    return endpoint.replace(/{/g, "${");
  }
}
