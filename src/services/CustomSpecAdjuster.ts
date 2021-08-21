import fs from "fs";
import path from "path";

import { load as toJsObject } from "js-yaml";
import { assertType } from "typescript-is";

import { customInputDir } from "../config";

/**
 * Adjusts YAML-parsed params by sorting keys alphabetically and
 * by separating any keys that contain a vertical bar.
 *
 * Used after parsing and before staging.
 */
export default class CustomSpecAdjuster {
  private yamlInputFileName: string;
  private mainParams: YamlParsedParams["mainParams"];
  private metaParams: YamlParsedParams["metaParams"];

  constructor(yamlInputFileName: string) {
    this.yamlInputFileName = yamlInputFileName;
  }

  public run() {
    const parsedParams = this.parseCustomSpec();

    this.mainParams = parsedParams.mainParams;
    this.metaParams = parsedParams.metaParams;

    this.mainParams = this.sortKeys(this.mainParams);
    this.separateKeys(this.mainParams);

    return {
      mainParams: this.mainParams,
      metaParams: this.metaParams,
    };
  }

  public parseCustomSpec(): YamlParsedParams {
    const filePath = path.join(customInputDir, this.yamlInputFileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonifiedContent = toJsObject(fileContent);

    if (validate(jsonifiedContent)) return jsonifiedContent;

    throw new Error("Invalid API mapping in YAML");
  }

  // TODO: type properly
  private sortKeys(value: any): any {
    if (this.isNotSortable(value)) return value;

    if (isOperationsArray(value)) {
      const sortedIds = value.map((i) => i.operationId).sort();
      return sortedIds.map((id) => value.find((i) => i.operationId === id));
    }

    // TODO: Review this
    // if (Array.isArray(value)) {
    //   const newArr = value.map((item) => this.sortKeys(item));

    //   // sort dropdown options
    //   if (newArr.every((i) => Object.keys(i).length === 1)) {
    //     const orderedKeys = value.map((i) => Object.keys(i)[0]).sort();
    //     return orderedKeys.map((key) => newArr.find((i) => i[key]));
    //   }

    //   return newArr.sort();
    // }

    // is sortable object
    const sorted: { [key: string]: string } = {};

    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortKeys(value[key]);
      });

    return sorted;
  }

  /**
   * Fields that always contain a string, skipped in `separateKeys`.
   */
  private nonSeparatorFields = [
    "endpoint",
    "operationId",
    "requestMethod",
    "operationUrl",
  ];

  /**
   * Traverse an object to adjust params that have a vertical bar.
   * TODO: Type properly
   */
  private separateKeys(obj: { [key: string]: any }) {
    Object.keys(obj).forEach((key) => {
      if (this.nonSeparatorFields.includes(key)) return;

      const value = obj[key];

      if (this.isStringArray(value))
        value.forEach((i: string) => (obj[key] = this.adjustSeparator(i)));

      if (this.isObjectArray(value))
        value.forEach((i: object) => this.separateKeys(i));

      if (this.isTraversableObject(value)) return this.separateKeys(value);

      obj[key] = this.adjustSeparator(value);
    });
  }

  private adjustSeparator(value: string | object[]) {
    if (Array.isArray(value)) return value;

    // TODO: vertical separator is REQUIRED for enum, for the time being
    if (value.startsWith("enum|") || value.startsWith("enum=")) {
      const [type, description] = value.split("|");

      const items = description
        .split("-")
        .slice(1)
        .map((item) => item.trim());

      const defaultValue = type.includes("=") ? type.split("=")[1] : items[0];

      return {
        type: "options",
        description: description.split("-")[0].trim(),
        enumItems: items,
        default: defaultValue,
      };
    }

    if (!value.includes("|"))
      return { type: value, default: this.getDefaultFromString(value) };

    const [type, description] = value.split("|");

    if (!type.includes("="))
      return { type, description, default: this.getDefaultFromString(type) };

    const [typeValue, defaultValue] = type.split("=");

    return { type: typeValue, description, default: defaultValue };
  }

  // ----------------------------------
  //            utils
  // ----------------------------------

  private getDefaultFromString(type: string) {
    if (type === "string") return "";
    if (type === "boolean") return false;
    if (type === "number") return 0;

    return "";
  }

  private isNotSortable(value: unknown) {
    return !value || typeof value !== "object";
  }

  private isObjectArray(value: unknown) {
    return (
      Array.isArray(value) && !!value.length && typeof value[0] === "object"
    );
  }

  private isStringArray(value: Array<unknown>) {
    return (
      Array.isArray(value) && !!value.length && typeof value[0] === "string"
    );
  }

  private isTraversableObject(value: unknown) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !!Object.keys(value).length
    );
  }
}

function isOperationsArray(value: unknown): value is Operation[] {
  return Array.isArray(value) && value[0].operationId;
}

function validate(object: unknown): object is YamlParsedParams {
  assertType<YamlInput>(object);
  return true;
}
