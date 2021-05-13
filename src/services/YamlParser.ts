import fs from "fs";
import path from "path";

import yaml from "js-yaml";
import { assertType } from "typescript-is";

import YamlStager from "./YamlStager";
import { yamlInputDir } from "../config";

/**
 * Responsible for parsing a YAML API description into a JSON API mapping,
 * also adjusting vertical bar strings into key-value pairs.
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
  private yamlInputFile: string;
  private yamlMainPreparams: YamlMainPreparams;
  private unsplittableFields = [
    "endpoint",
    "operationId",
    "requestMethod",
    "operationUrl",
  ];

  constructor(yamlInputFile: string) {
    this.yamlInputFile = yamlInputFile;
  }

  public run() {
    const { metaParams, mainParams } = this.jsonifyYaml();

    this.yamlMainPreparams = this.sortKeys(mainParams);

    this.iterateOverOperations((operation: YamlOperation) =>
      this.traverseToAdjust(operation)
    );

    return new YamlStager({
      mainParams: this.yamlMainPreparams,
      metaParams: metaParams,
    }).run();
  }

  private jsonifyYaml() {
    const yamlFilePath = path.join(yamlInputDir, this.yamlInputFile);
    const yamlFileContent = fs.readFileSync(yamlFilePath, "utf-8");
    const jsonifiedYaml = yaml.load(yamlFileContent);

    assertType<YamlInput>(jsonifiedYaml);

    return jsonifiedYaml as YamlPreparams;
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

      return newArr.sort();
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
    Object.keys(this.yamlMainPreparams).forEach((resource) => {
      const operationsPerResource = this.yamlMainPreparams[resource];
      operationsPerResource.forEach((operation) => callback(operation));
    });
  }

  /**
   * Traverse the parsed JSON object to find and adjust strings with a vertical bar.
   * TODO: Type arg properly
   */
  private traverseToAdjust(object: { [key: string]: any }) {
    Object.keys(object).forEach((key) => {
      if (Array.isArray(object[key]) && object[key].length) {
        if (typeof object[key][0] === "string") {
          object[key].forEach((item: string) => {
            object[key] = this.adjustAtSeparator(item);
          });
        } else {
          object[key].forEach((item: object) => this.traverseToAdjust(item));
        }
      }

      if (this.isTraversable(object[key])) {
        return this.traverseToAdjust(object[key]);
      }

      if (this.unsplittableFields.includes(key)) return;

      object[key] = this.adjustAtSeparator(object[key]);
    });
  }

  private isTraversable(value: unknown) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !!Object.keys(value).length
    );
  }

  private adjustAtSeparator(value: string | object[]) {
    if (Array.isArray(value)) return value;

    // for now, vertical separator is REQUIRED for enum
    if (value.startsWith("enum|")) {
      const [_, description] = value.split("|");
      const items = description.split("-").map((item) => item.trim())
      return { type: 'options', description: items[0], enumItems: items.slice(1), default: items[1] };
    };

    if (value.includes("|")) {
      const [type, description] = value.split("|");
      return { type, description, default: this.getDefaultFromString(type) };
    }

    return { type: value, default: this.getDefaultFromString(value) };
  }

  private getDefaultFromString(type: string) {
    if (type === "string") return "";
    if (type === "boolean") return false;
    if (type === "number") return 0;

    return "";
  }
}
