import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { printTranslation } from "../utils/FilePrinter";

/**
 * Translates a YAML API mapping into a JSON API mapping, adjusting strings with `|`.
 *
 * From:
 * ```yaml
 * Company:
 *   - endpoint: /companies
 *     operationId: create
 *     requestMethod: POST
 *     requestBody:
 *       name: string|Name of the company to create.
 *     # ...
 * ```
 *
 * To:
 * ```json
 * "Company": [
 *   {
 *     "endpoint": "/companies",
 *     "operationId": "create",
 *     "requestMethod": "POST",
 *     "requestBody": {
 *     "name": {
 *        "type": "string",
 *        "description": "Name of the company to create."
 *      }
 *   },
 *   // ...
 * ```
 */
export default class YamlParser {
  private yamlFile: string;
  private yamlMainParams: YamlMainParams;
  private unsplittableFields = [
    "endpoint",
    "operationId",
    "operationUrl",
    "requestMethod",
  ];

  constructor(yamlFile: string) {
    this.yamlFile = yamlFile;
  }

  public run() {
    const yamlParams = this.jsonifyYaml();
    this.yamlMainParams = this.sortKeys(yamlParams.mainParams);

    this.iterateOverOperations((operation: YamlOperation) =>
      this.traverseToAdjust(operation)
    );

    printTranslation(this.yamlMainParams); // TEMP

    return {
      mainParams: this.yamlMainParams,
      metaParams: yamlParams.metaParams,
    };
  }

  private jsonifyYaml() {
    const yamlFilePath = path.join("src", "input", this.yamlFile + ".yaml");
    const yamlFileContent = fs.readFileSync(yamlFilePath, "utf-8");

    return yaml.load(yamlFileContent) as YamlNodegenParams;
  }

  // TODO: type properly
  private sortKeys(value: any): any {
    if (!value || typeof value !== "object") return value;

    if (Array.isArray(value)) {
      const newArr = value.map((item) => this.sortKeys(item));

      // sort keys for dropdown options
      if (newArr.every((i) => Object.keys(i).length === 1)) {
        const orderedKeys = value.map((i) => Object.keys(i)[0]).sort();
        return orderedKeys.map((key) => newArr.find((i) => i[key]));
      }

      newArr.sort();
      return newArr;
    }

    const sorted: { [key: string]: string } = {};

    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortKeys(value[key]);
      });

    return sorted;
  }

  private iterateOverOperations(callback: (operation: YamlOperation) => void) {
    Object.keys(this.yamlMainParams).forEach((resource) => {
      const operationsPerResource = this.yamlMainParams[resource];
      operationsPerResource.forEach((operation) => callback(operation));
    });
  }

  /**
   * Traverse the JSON object to find and adjust strings with a vertical bar.
   * TODO: Type arg properly
   */
  private traverseToAdjust(object: { [key: string]: any }) {
    Object.keys(object).forEach((key) => {
      if (Array.isArray(object[key]) && object[key].length) {
        // ----------------------------------
        //        base case: string[]
        // ----------------------------------
        if (typeof object[key][0] === "string") {
          object[key].forEach((item: string) => {
            object[key] = this.adjustAtSeparator(item);
          });
        } else {
          // ----------------------------------
          //      recursive case: object[]
          // ----------------------------------
          object[key].forEach((item: object) => this.traverseToAdjust(item));
        }
      }

      // ----------------------------------
      //      recursive case: object
      // ----------------------------------
      if (this.isTraversable(object[key])) {
        return this.traverseToAdjust(object[key]);
      }
      // ----------------------------------
      //        base case: string
      // ----------------------------------
      if (this.unsplittableFields.includes(key)) return;

      object[key] = this.adjustAtSeparator(object[key]);
    });
  }

  private isTraversable(value: unknown) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !!Object.keys(value).length // TODO: Avoid `!!`
    );
  }

  private adjustAtSeparator(value: string | object[]) {
    if (Array.isArray(value)) return value;

    if (value.includes("|")) {
      const [type, description] = value.split("|");
      return { type, description, default: this.getDefault(value) };
    }

    return { type: value, default: this.getDefault(value) };
  }

  // TODO: Type properly
  private getDefault(arg: any) {
    if (arg.default) return arg.default;
    if (arg.type === "boolean") return false;
    if (arg.type === "number") return 0;
    return "";
  }
}
