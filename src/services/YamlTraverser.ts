/**
 * Traverses params from a YAML API mapping to
 * - sort keys alphabetically, and
 * - separate keys based at`|`.
 *
 * Used before staging.
 */
export default class YamlTraverser {
  private preTraversalMainParams: PreTraversalParams["mainParams"];
  private preTraversalMetaParams: PreTraversalParams["metaParams"];

  /**
   * Fields that always contain a string, skipped in `separateKeys`.
   */
  private nonSeparatorFields = [
    "endpoint",
    "operationId",
    "requestMethod",
    "operationUrl",
  ];

  constructor(preTraversalParams: PreTraversalParams) {
    this.preTraversalMainParams = preTraversalParams.mainParams;
    this.preTraversalMetaParams = preTraversalParams.metaParams;
  }

  public run() {
    this.preTraversalMainParams = this.sortKeys(this.preTraversalMainParams);
    this.separateKeys(this.preTraversalMainParams);

    return {
      mainParams: this.preTraversalMainParams,
      metaParams: this.preTraversalMetaParams,
    };
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
   * Traverse an object to find and params that have a vertical bar.
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
    return Array.isArray(value) && value.length && typeof value[0] === "object";
  }

  private isStringArray(value: Array<unknown>) {
    return Array.isArray(value) && value.length && typeof value[0] === "string";
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
