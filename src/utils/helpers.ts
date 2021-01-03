import { camelCase, pascalCase, capitalCase } from "change-case";

export default {
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
};
