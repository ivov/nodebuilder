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
    this.adjustInputTypeAndDescription();
    // TODO this.adjustObjectType() for `object:`
    console.log(JSON.stringify(this.inputMainParams, null, 2));
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

  private iterateOverInputOperations(callback: Function) {
    Object.keys(this.inputMainParams).forEach((resource) => {
      this.currentResource = resource;
      this.inputMainParams[resource].forEach((inputOperation) => {
        callback(inputOperation);
      });
    });
  }

  /**
   * Adjust YAML-derived object by splitting by splitting string values that contain
   * a vertical bar `|` into `type` and `description` properties.
   */
  private adjustInputTypeAndDescription() {
    this.iterateOverInputOperations((inputOperation: YamlOperation) => {
      this.nestingProperties.forEach((property) => {
        if (!inputOperation[property]) return;

        Object.entries(inputOperation[property]).forEach(([key, value]) => {
          if (this.isTraversableObject(value)) {
            // TODO: refactor to remove duplication ------------------
            const traversableObject = value as object; // TODO: Type properly
            const topLevelValue = inputOperation[property][key];

            Object.entries(traversableObject).forEach(([trKey, trValue]) => {
              if (typeof trValue === "string") {
                if (trValue.includes("|")) {
                  const [type, description] = trValue.split("|");
                  // @ts-ignore
                  topLevelValue[trKey] = { type, description };
                } else {
                  // @ts-ignore
                  topLevelValue[trKey] = { type: trValue };
                }
              }
            });
            // ---------------------------------------------------
          }

          if (typeof value === "string") {
            if (value.includes("|")) {
              const [type, description] = value.split("|");
              inputOperation[property][key] = { type, description };
            } else {
              inputOperation[property][key] = { type: value };
            }
          }
        });
      });
    });
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
    this.iterateOverInputOperations((inputOperation: YamlOperation) => {
      const operation = this.getOperation(inputOperation);
      const pathParams = this.getPathParams(inputOperation);
      const qsParams = this.getQsParams(inputOperation);
      const requestBody = this.getRequestBody(inputOperation);
      const additionalFields = this.getAdditionalFields(inputOperation);
      // TODO: get filters
      // TODO: get updateFields

      if (pathParams || qsParams) {
        // operation.parameters = [];
        if (pathParams) operation.parameters = pathParams;
        if (qsParams) operation.parameters = qsParams;
      }

      if (requestBody) operation.requestBody = requestBody;
      if (additionalFields) operation.additionalFields = additionalFields;

      this.outputMainParams[this.currentResource].push(operation);
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

    return pathParams.map((pathParam) => ({
      in: "path" as const, // casting to infer string literal
      name: pathParam,
      schema: {
        type: "string",
      },
      required: true,
    }));
  }

  private getQsParams({ queryString }: YamlOperation) {
    if (!queryString) return null;

    return Object.entries(queryString).map(([key, value]) => ({
      in: "query" as const, // casting to infer string literal
      name: key,
      required: true,
      schema: {
        type: value.type,
      },
      description: value.description ?? "", // TODO: do not add if null/undefined
    }));
  }

  private getRequestBody({ requestBody }: YamlOperation) {
    if (!requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      // TODO: add other MIME types
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

    return {
      required: true,
      ...outputRequestBody,
    };
  }

  private getAdditionalFields({ additionalFields }: YamlOperation) {
    if (!additionalFields) return;

    const outputAdditionalFields: AdditionalFields = {
      name: "Additional Fields",
      type: "collection",
      description: "",
      default: {},
      options: [],
    };

    for (const property in additionalFields) {
      // TODO: additional fields for requestBody
      if (property === "queryString") {
        const qsFields = additionalFields[property];
        if (!qsFields) continue;

        Object.entries(qsFields).forEach(([key, value]) => {
          outputAdditionalFields.options.push({
            in: "query",
            name: key,
            type: value.type,
            default: "",
            description: value.description ?? "",
          });
        });
      }
    }

    return outputAdditionalFields;
  }
}
