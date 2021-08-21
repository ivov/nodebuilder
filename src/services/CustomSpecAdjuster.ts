import fs from "fs";
import path from "path";
import { load as toJsObject } from "js-yaml";
import { customInputDir } from "../config";

export default class CustomSpecAdjuster {
  private customSpecFileName: string;
  private mainParams: CustomSpecParams["mainParams"];

  constructor(customSpecFileName: string) {
    this.customSpecFileName = customSpecFileName;
  }

  public run() {
    const parsedCustomSpec = this.parseCustomSpec();

    this.mainParams = parsedCustomSpec.mainParams;

    this.mainParams = this.sortKeys(this.mainParams);
    this.separateKeys(this.mainParams);

    return {
      mainParams: this.mainParams,
      metaParams: parsedCustomSpec.metaParams,
    };
  }

  public parseCustomSpec() {
    const filePath = path.join(customInputDir, this.customSpecFileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return toJsObject(fileContent) as CustomSpecParams;
  }

  private sortKeys(value: any): any {
    if (this.cannotBeSorted(value)) return value;

    // alphabetize operations by operationId
    if (this.isOperationsArray(value)) {
      value;
      const sortedIds = value.map((i) => i.operationId).sort();
      return sortedIds.map((id) => value.find((i) => i.operationId === id));
    }

    // alphabetize object keys - recursive
    const sorted: { [key: string]: string | object } = {};

    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortKeys(value[key]);
      });

    return sorted;
  }

  private skipFields = [
    "endpoint",
    "operationId",
    "requestMethod",
    "operationUrl",
  ];

  private separateKeys(obj: any) {
    Object.keys(obj).forEach((key) => {
      if (this.skipFields.includes(key)) return;

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

    if (value.startsWith("options") && !value.includes("|")) {
      const [type, ...items] = value.split("-").map((i) => i.trim());

      return {
        type,
        options: items,
        default: items[0],
      };
    }

    if (value.startsWith("options") && value.includes("|")) {
      const [type, rest] = value.split("|");
      const [description, ...items] = rest.split("-").map((i) => i.trim());
      const defaultOption = type.includes("=") ? type.split("=")[1] : items[0];

      return {
        type,
        description,
        options: items,
        default: defaultOption,
      };
    }

    if (!this.isSimpleType(value)) throw new Error("Unknown type: " + value);

    if (!value.includes("|")) {
      return { type: value, default: this.getDefaultValue(value) };
    }

    if (value.includes("=|")) {
      const [type, description] = value.split("|");
      const [typeValue, defaultValue] = type.split("=");
      return { type: typeValue, description, default: defaultValue };
    }

    if (value.includes("|")) {
      const [type, description] = value.split("|");
      return { type, description, default: this.getDefaultValue(type) };
    }

    return { type: value, default: this.getDefaultValue(value) };
  }

  // ----------------------------------
  //            utils
  // ----------------------------------

  private getDefaultValue(type: string) {
    if (type === "boolean") return false;
    if (type === "number") return 0;

    return "";
  }

  private cannotBeSorted(value: unknown) {
    return !value || typeof value !== "object";
  }

  private isOperationsArray(value: unknown): value is CustomSpecOperation[] {
    return Array.isArray(value) && value[0].operationId;
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

  private isSimpleType(value: string) {
    const simpleTypes = [
      "string",
      "number",
      "boolean",
      "loadOptions",
      "dateTime",
    ];
    return simpleTypes.some((type) => value.includes(type));
  }
}

// TODO: Review this, for sortKeys
// if (Array.isArray(value)) {
//   const newArr = value.map((item) => this.sortKeys(item));

//   // sort dropdown options
//   if (newArr.every((i) => Object.keys(i).length === 1)) {
//     const orderedKeys = value.map((i) => Object.keys(i)[0]).sort();
//     return orderedKeys.map((key) => newArr.find((i) => i[key]));
//   }

//   return newArr.sort();
// }
