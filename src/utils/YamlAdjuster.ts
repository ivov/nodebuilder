export default class YamlAdjuster {
  private inputMainParams: YamlMainParams;
  private outputMainParams: MainParams = {};

  constructor(inputMainParams: YamlMainParams) {
    this.inputMainParams = inputMainParams;
    Object.keys(inputMainParams).forEach((key) => {
      this.outputMainParams[key] = [];
    });
  }

  public run() {
    this.adjustTypeAndDescription();
    this.populateOutputParams();
    // console.log(JSON.stringify(this.outputMainParams, null, 2));
    return this.outputMainParams;
  }

  /**
   * Adjust type and description in YAML strings by splitting those containing a vertical bar `|`.
   */
  private adjustTypeAndDescription() {
    Object.values(this.inputMainParams).forEach((inputOperations) => {
      inputOperations.forEach((inputOperation) => {
        ["queryString", "requestBody"].forEach((property) => {
          if (!inputOperation[property]) return;

          Object.entries(inputOperation[property]).forEach(([key, value]) => {
            if (typeof value === "string" && value.includes("|")) {
              const [type, description] = value.split("|");
              inputOperation[property][key] = { type, description };
            } else if (typeof value === "string") {
              inputOperation[property][key] = { type: value };
            }
          });

          // TODO: Make this second half recursive?
          const addFields = inputOperation["additionalFields"];

          if (addFields) {
            ["queryString", "requestBody"].forEach((property) => {
              const addFieldsProperty = addFields[property];
              if (!addFieldsProperty) return;

              Object.entries(addFieldsProperty).forEach(([key, value]) => {
                if (typeof value === "string" && value.includes("|")) {
                  const [type, description] = value.split("|");
                  addFieldsProperty[key] = { type, description };
                } else if (typeof value === "string") {
                  addFieldsProperty[key] = { type: value };
                }
              });
            });
          }
        });
      });
    });
  }

  private populateOutputParams() {
    Object.keys(this.inputMainParams).forEach((resource) => {
      this.inputMainParams[resource].forEach((inputOperation) => {
        const operation = this.getOperation(inputOperation);

        const pathParams = this.getPathParams(inputOperation);
        const qsParams = this.getQsParams(inputOperation);
        const requestBody = this.getRequestBody(inputOperation);
        const additionalFields = this.getAdditionalFields(inputOperation);

        if (pathParams || qsParams) {
          operation.parameters = [];
          if (pathParams) operation.parameters.push(...pathParams);
          if (qsParams) operation.parameters.push(...qsParams);
        }

        if (requestBody) operation.requestBody = requestBody;
        if (additionalFields) operation.additionalFields = additionalFields;

        this.outputMainParams[resource].push(operation);
      });
    });
  }

  private getOperation(inputOperation: YamlOperation): Operation {
    return {
      endpoint: inputOperation.endpoint,
      requestMethod: inputOperation.requestMethod,
      operationId: inputOperation.operationId,
    };
  }

  private getPathParams(inputOperation: YamlOperation) {
    if (inputOperation.endpoint.split("").includes("{")) {
      const pathParams = inputOperation.endpoint.match(/(?<={)(.*?)(?=})/g);

      if (!pathParams) return null;

      return pathParams.map((pathParam) => ({
        in: "path" as const,
        name: pathParam.toString(),
        schema: {
          type: "string",
        },
        required: true,
      }));
    }
  }

  private getQsParams(inputOperation: YamlOperation) {
    if (!inputOperation.queryString) return null;

    return Object.entries(inputOperation.queryString).map(([key, value]) => ({
      in: "query" as const,
      name: key,
      required: true,
      schema: {
        type: value.type,
      },
      description: value.description ?? "",
    }));
  }

  private getRequestBody(inputOperation: YamlOperation) {
    if (!inputOperation.requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      // TODO: other MIME types
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    };

    Object.entries(inputOperation.requestBody).forEach(([key, value]) => {
      outputRequestBody.content[
        "application/x-www-form-urlencoded"
      ].schema.properties[key] = value;
    });

    return {
      required: true,
      ...outputRequestBody,
    };
  }

  private getAdditionalFields(inputOperation: YamlOperation) {
    if (!inputOperation.additionalFields) return;

    const outputAddFields: AdditionalFields = {
      name: "Additional Fields",
      type: "collection",
      description: "",
      default: {},
      options: [],
    };

    for (const property in inputOperation.additionalFields) {
      if (property === "queryString") {
        const inputQsAddFields = inputOperation.additionalFields[property];
        if (!inputQsAddFields) continue;

        Object.entries(inputQsAddFields).forEach(([key, value]) => {
          outputAddFields.options.push({
            in: "query",
            name: key,
            type: value.type,
            default: "",
            description: value.description ?? "",
          });
        });
      }
    }

    return outputAddFields;
  }
}
