import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { printTranslation } from "../utils/FilePrinter";

/**
Translates a YAML API mapping into a JSON API mapping, adjusting strings with `|`.

From:
 ```yaml
 Company:
    - endpoint: /companies
      operationId: create
      requestMethod: POST
      requestBody:
        name: string|Name of the company to create.
      # ...
```

To:
```json
"Company": [
  {
    "endpoint": "/companies",
    "operationId": "create",
    "requestMethod": "POST",
    "requestBody": {
      "name": {
        "type": "string",
        "description": "Name of the company to create."
      }
    },
    // ...
 ```
*/
export default class YamlParser {
  private yamlMainParams: YamlMainParams;
  private unsplittableFields = [
    "endpoint",
    "operationId",
    "operationUrl",
    "requestMethod",
  ];

  public run() {
    const yamlParams = this.jsonifyYaml();
    this.yamlMainParams = yamlParams.mainParams;

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
    const yamlFilePath = path.join("src", "input", "copper.yaml"); // TEMP

    return yaml.load(
      fs.readFileSync(yamlFilePath, "utf-8")
    ) as YamlNodegenParams;
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
      !!Object.keys(value).length
    );
  }

  private adjustAtSeparator(value: string | object[]) {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      if (value.includes("|")) {
        const [type, description] = value.split("|");
        return { type, description, default: this.getDefault(value) };
      }

      return { type: value, default: this.getDefault(value) };
    }
  }

  // TODO: Type properly
  private getDefault(arg: any) {
    if (arg.default) return arg.default;
    if (arg.type === "boolean") return false;
    if (arg.type === "number") return 0;
    return "";
  }
}
