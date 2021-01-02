import { camelCase, pascalCase } from "change-case";

export default {
  camelCase,
  pascalCase,
  escape: (str: string) => str.replace(/\n/g, "<br>").replace(/'/g, "’"),
  isOperationParameter: (field: any) => field.hasOwnProperty("in"),
  hasMinMax: (parameter: OperationParameter) =>
    parameter.schema.minimum && parameter.schema.maximum,
};
