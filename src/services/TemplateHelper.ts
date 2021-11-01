import { camelCase, capitalCase, pascalCase } from "change-case";
import { titleCase } from "title-case";

export class Helper {
  adjustType = (type: string, name: string) => {
    if (type === "integer") return "number";
    if (name.toLowerCase().includes("date")) return "dateTime";
    return type;
  };

  camelCase = (str: string) => camelCase(str);

  capitalCase = (str: string) => capitalCase(str);

  escape = (str: string) => str.replace(/(\r)?\n/g, "<br>").replace(/'/g, "’");

  getCredentialsString = (name: string, auth: AuthType) =>
    this.camelCase(name) + (auth === "OAuth2" ? "OAuth2" : "") + "Api";

  getDefault(arg: any) {
    if (arg.default) {
      if (arg.type === "boolean" || arg.type === "number") return arg.default;

      if (arg.type === "string" || arg.type === "options")
        return `'${arg.default}'`;

      // edge case: number type with string default (third-party error)
      if (
        typeof arg.default === "string" &&
        (arg.type === "number" || arg.type === "integer")
      ) {
        return 0;
      }
    }

    if (
      arg.type === "string" ||
      arg.type === "dateTime" ||
      arg.type === "loadOptions"
    )
      return "''";
    if (arg.type === "number" || arg.type === "integer") return 0;
    if (arg.type === "boolean") return false;
    if (arg.type === "options") return `'${arg.options[0]}'`;

    return "''";
  }

  getParams = (params: OperationParameter[], type: "query" | "path") =>
    params.filter((p) => p.in === type).map((p) => p.name);

  hasMinMax = (arg: any) => arg.minimum && arg.maximum;

  pascalCase = (str: string) => pascalCase(str);

  titleCase = (str: string) => {
    const base = str.replace(/[._]/g, " ").trim();

    return str.includes("_")
      ? titleCase(base).replace("Id", "ID") // for snake case
      : titleCase(base.replace("Id", " ID")); // for camel case
  };

  toTemplateLiteral = (endpoint: string) => endpoint.replace(/{/g, "${");

  getPlaceholder = (property: string) => {
    if (property === "Filters") return "Add Filter";
    return "Add Field";
  };

  addFieldsSuffix = (key: string) =>
    key.split("").includes("_") ? key + "_fields" : key + "Fields";
}
