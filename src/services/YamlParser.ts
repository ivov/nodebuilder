import fs from "fs";
import path from "path";

import { load as jsonifyYaml } from "js-yaml";
import { assertType } from "typescript-is";

import YamlStager from "./YamlStager";
import { yamlInputDir } from "../config";

/**
 * Responsible for parsing a YAML API description into a JSON API mapping,
 * also sorting and adjusting vertical bar strings into key-value pairs.
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
  /**
   * Name of the YAML input file to parse.
   */
  private yamlInputFileName: string;

  /**
   * Jsonified params from the YAML input file, before adjustment in `traverseToAdjust`.
   */
  private yamlMainPreparams: YamlMainPreparams;

  /**
   * Fields that always contain a string, so they can be skipped in `traverseToAdjust`.
   */
  private unsplittableFields = [
    "endpoint",
    "operationId",
    "requestMethod",
    "operationUrl",
  ];

  constructor(yamlInputFileName: string) {
    this.yamlInputFileName = yamlInputFileName;
  }

  public run() {
    const { metaParams, mainParams } = this.prepareYaml();
    this.yamlMainPreparams = this.sortKeys(mainParams);

    this.iterateOverInputOperations((inputOperation: YamlOperation) =>
      this.traverseToAdjust(inputOperation)
    );

    return new YamlStager({
      mainParams: this.yamlMainPreparams,
      metaParams: metaParams,
    }).run();
  }

  private prepareYaml() {
    const jsonifiedYaml = jsonifyYaml(this.readYaml());
    this.validateInput(jsonifiedYaml);

    return jsonifiedYaml as YamlPreparams; // TODO: Replace with type guard
  }

  private readYaml() {
    const fullYamlFilePath = path.join(yamlInputDir, this.yamlInputFileName);
    return fs.readFileSync(fullYamlFilePath, "utf-8");
  }

  /**
   * Validate that the jsonified YAML input file content adheres to the shape of `YamlInput`.
   */
  private validateInput(jsonifiedYaml: JsonObject) {
    assertType<YamlInput>(jsonifiedYaml);
  }

  // TODO: type properly
  private sortKeys(value: any): any {
    if (!value || typeof value !== "object") return value;

    if (Array.isArray(value)) {
      const newArr = value.map((item) => this.sortKeys(item));

      // sort operations by operationId
      if (value.every((i) => i.operationId)) {
        const sortedOperationIds = value.map((i) => i.operationId).sort();
        return sortedOperationIds.map((operationId) =>
          value.find((i) => i.operationId === operationId)
        );
      }

      // sort dropdown options
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

  private iterateOverInputOperations(
    callback: (inputOperation: YamlOperation) => void
  ) {
    this.getResources().forEach((resource) => {
      const operationsPerResource = this.yamlMainPreparams[resource];
      operationsPerResource.forEach((operation) => callback(operation));
    });
  }

  /**
   * Return all the resource names of the API.
   */
  private getResources() {
    return Object.keys(this.yamlMainPreparams);
  }

  /**
   * Traverse the parsed JSON object to find and adjust strings with a vertical bar.
   * TODO: Type arg properly, account for null
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
      const items = description.split("-").map((item) => item.trim());
      return {
        type: "options",
        description: items[0],
        enumItems: items.slice(1),
        default: items[1],
      };
    }

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
