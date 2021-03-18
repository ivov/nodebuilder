import { writeFileSync } from "fs";

export default class YamlAdjuster {
  private inputMainParams: YamlMainParams;
  private outputMainParams: MainParams = {};
  private nestingProperties = [
    "queryString",
    "requestBody",
    "additionalFields",
    "filters",
    "updateFields",
  ];
  private currentResource = "";

  constructor(inputMainParams: YamlMainParams) {
    this.inputMainParams = inputMainParams;
  }

  public run() {
    this.adjustInputParams();
    // TODO this.adjustObjectType() for `object:`
    // TODO this.adjustObjectType() for `array:`
    // console.log(JSON.stringify(this.inputMainParams, null, 2));
    // @ts-ignore
    writeFileSync(
      "output.json",
      JSON.stringify(this.inputMainParams, null, 2),
      "utf8"
    );
    this.prepareOutputParams();
    this.populateOutputParams();
    // console.log(JSON.stringify(this.outputMainParams, null, 2));
    return this.outputMainParams;
  }

  private prepareOutputParams() {
    Object.keys(this.inputMainParams).forEach((key) => {
      this.outputMainParams[key] = [];
    });
  }

  private iterateOverInputOperations(
    callback: (inputOperation: YamlOperation) => void
  ) {
    Object.keys(this.inputMainParams).forEach((resource) => {
      this.currentResource = resource;
      this.inputMainParams[resource].forEach((inputOperation) => {
        callback(inputOperation);
      });
    });
  }

  private adjustInputParams() {
    this.iterateOverInputOperations((inputOperation: YamlOperation) => {
      this.nestingProperties.forEach((property) => {
        if (!inputOperation[property]) return;

        Object.entries(inputOperation[property]).forEach(([key, value]) => {
          if (this.isTraversableObject(value)) {
            const nestedObject = inputOperation[property][key];

            // TODO: Type properly
            Object.keys(value as object).forEach((trKey) => {
              this.splitAtVerticalBar(value, nestedObject, trKey);
            });
          }

          this.splitAtVerticalBar(value, inputOperation[property], key);
        });
      });
    });
  }

  /**
   * Splitting string values that contain a vertical bar `|` into `type` and `description` properties.
   */
  // TODO: Type properly
  private splitAtVerticalBar(value: any, propertyToSet: any, key: string) {
    if (typeof value === "string") {
      if (value.includes("|")) {
        const [type, description] = value.split("|");
        propertyToSet[key] = { type, description };
      } else {
        propertyToSet[key] = { type: value };
      }
    }
  }

  private isTraversableObject(
    value: any
  ): value is YamlOperation["additionalFields"] {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !!Object.keys(value).length
    );
  }

  private populateOutputParams() {
    this.iterateOverInputOperations((operation: YamlOperation) => {
      const outputOperation = this.getOperation(operation);

      const pathParams = this.getPathParams(operation);
      const qsParams = this.getQsParams(operation, { required: true });
      const requestBody = this.getRequestBody(operation, { required: true });
      const additionalFields = this.getAdditionalFields(operation);

      // TODO: get and set filters
      // TODO: get and set updateFields

      if (pathParams) outputOperation.parameters = pathParams;
      if (qsParams) outputOperation.parameters = qsParams;
      if (requestBody) outputOperation.requestBody = requestBody;
      if (additionalFields) outputOperation.additionalFields = additionalFields;

      this.outputMainParams[this.currentResource].push(outputOperation);
    });
  }

  private getOperation({
    endpoint,
    requestMethod,
    operationId,
  }: YamlOperation): Operation {
    return {
      endpoint,
      requestMethod,
      operationId,
    };
  }

  private getPathParams({ endpoint }: YamlOperation) {
    if (!endpoint.match(/\{/)) return;

    const pathParams = endpoint.match(/(?<={)(.*?)(?=})/g);

    if (!pathParams) return null;

    return pathParams.map(this.openApiPathParam);
  }

  private openApiPathParam(pathParam: string) {
    return {
      in: "path" as const,
      name: pathParam,
      schema: {
        type: "string",
      },
      required: true,
    };
  }

  private getQsParams(
    { queryString }: YamlOperation,
    { required }: { required: boolean }
  ) {
    if (!queryString) return null;

    return Object.entries(queryString).map(([key, value]) =>
      this.openApiQsParam(key, value, { required })
    );
  }

  private openApiQsParam(
    qsKey: string,
    qsValue: { type: string; description?: string },
    { required }: { required: boolean }
  ) {
    return {
      in: "query" as const,
      name: qsKey,
      required,
      schema: {
        type: qsValue.type,
      },
      default: this.getDefault(qsValue.type),
      description: qsValue.description ?? "", // TODO: do not add if null/undefined
    };
  }

  private getDefault(type: string) {
    if (type === "boolean") return false;
    if (type === "number") return 0;
    return "";
  }

  private getRequestBody(
    { requestBody }: YamlOperation,
    { required }: { required: boolean }
  ) {
    if (!requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      // TODO: add other MIME types
      required,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    };

    Object.entries(requestBody).forEach(([key, value]) => {
      outputRequestBody.content[
        "application/x-www-form-urlencoded"
      ].schema.properties[key] = value;
    });

    return outputRequestBody;
  }

  private getAdditionalFields(operation: YamlOperation) {
    const { additionalFields } = operation;

    if (!additionalFields) return;

    const outputAddFields: AdditionalFields = {
      name: "Additional Fields",
      type: "collection",
      description: "",
      default: {},
      options: [],
    };

    const qsAddFields = additionalFields["queryString"];

    if (qsAddFields) {
      Object.entries(qsAddFields).forEach(([key, value]) =>
        outputAddFields.options.push(
          this.openApiQsParam(key, value, { required: false })
        )
      );
    }

    // TODO: additional fields for requestBody
    // else if (rbAddFields) {
    //   outputAdditionalFields.options.push(
    //     this.getRequestBody(operation, { required: false })
    //   );
    // }

    return outputAddFields;
  }
}
