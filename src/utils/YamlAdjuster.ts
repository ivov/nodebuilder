import { writeFileSync } from "fs";

export default class YamlAdjuster {
  private inputMainParams: YamlMainParams;
  private outputMainParams: MainParams = {};
  private mainFields = [
    "endpoint",
    "operationId",
    "operationUrl",
    "requestMethod",
  ];
  private currentResource = "";

  constructor(inputMainParams: YamlMainParams) {
    this.inputMainParams = inputMainParams;
  }

  public run() {
    const printOutput = (type: string) =>
      writeFileSync(
        `${type}-output.json`,
        JSON.stringify(
          type === "intermediate"
            ? this.inputMainParams
            : this.outputMainParams,
          null,
          2
        ),
        "utf8"
      ); // TEMP

    this.adjustInputParams();
    printOutput("intermediate"); // TEMP
    this.prepareOutputParams();
    this.populateOutputParams();
    printOutput("final"); // TEMP
    return this.outputMainParams;
  }

  private prepareOutputParams() {
    Object.keys(this.inputMainParams).forEach((key) => {
      this.outputMainParams[key] = [];
    });
  }

  private adjustInputParams() {
    this.iterateOverInputOperations((operation: YamlOperation) => {
      this.traverse(operation);
    });
  }

  private iterateOverInputOperations(
    callback: (operation: YamlOperation) => void
  ) {
    Object.keys(this.inputMainParams).forEach((resource) => {
      this.currentResource = resource;
      this.inputMainParams[resource].forEach((operation) => {
        callback(operation);
      });
    });
  }

  // TODO: Type arg properly
  private traverse(object: { [key: string]: any }) {
    Object.keys(object).forEach((key) => {
      if (Array.isArray(object[key]) && object[key].length) {
        // base case: string[]
        if (typeof object[key][0] === "string") {
          object[key].forEach(
            (item: string) => (object[key] = this.splitAtSeparator(item))
          );
        } else {
          // recursive case: object[]
          object[key].forEach((item: object) => this.traverse(item));
        }
      }

      // recursive case: traversable object
      if (this.isTraversable(object[key])) return this.traverse(object[key]);

      // base case: string
      if (this.mainFields.includes(key)) return;
      object[key] = this.splitAtSeparator(object[key]);
    });
  }

  private splitAtSeparator(value: string | object[]) {
    if (typeof value === "string") {
      if (value.includes("|")) {
        const [type, description] = value.split("|");
        return { type, description };
      }

      return { type: value };
    }

    if (Array.isArray(value)) return value;
  }

  private isTraversable(value: unknown) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !!Object.keys(value).length
    );
  }

  private populateOutputParams() {
    this.iterateOverInputOperations((yamlOperation: YamlOperation) => {
      const outputOperation = this.getOperation(yamlOperation);

      const pathParams = this.getPathParams(yamlOperation.endpoint);
      const qsParams = this.getQsParams(yamlOperation.queryString, {
        required: true,
      });

      const qsAddFields = this.getQsAdditionalFields(
        yamlOperation.additionalFields
      );

      const requestBody = this.getRequestBody(yamlOperation.requestBody, {
        required: true,
      });

      const rbAdditionalFields = this.getAddFieldsRequestbody(yamlOperation);

      // TODO: get and set filters
      // TODO: get and set updateFields

      if (pathParams) outputOperation.parameters = pathParams;

      if (qsParams) outputOperation.parameters = qsParams;
      if (qsAddFields) outputOperation.additionalFields = qsAddFields;

      if (requestBody || rbAdditionalFields) {
        outputOperation.requestBody = [];
        if (requestBody) outputOperation.requestBody.push(requestBody);
        if (rbAdditionalFields)
          outputOperation.requestBody.push(rbAdditionalFields);
      }

      this.outputMainParams[this.currentResource].push(outputOperation);
    });
  }

  private getOperation({
    endpoint,
    requestMethod,
    operationId,
    operationUrl,
  }: YamlOperation): Operation {
    const operation: Operation = {
      endpoint,
      requestMethod,
      operationId,
    };
    if (operationUrl) operation.operationUrl = operationUrl;
    return operation;
  }

  private getPathParams(endpoint: string) {
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
    queryString: YamlOperation["queryString"],
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
    requestBody: YamlOperation["requestBody"],
    { required }: { required: boolean }
  ) {
    if (!requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      // TODO: add other types: `multipart/form-data` and `text/plain`
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

  private getQsAdditionalFields(
    additionalFields: YamlOperation["additionalFields"]
  ) {
    if (!additionalFields) return null;

    const outputAddFieldsQs: AdditionalFields = {
      name: "Additional Fields",
      type: "collection",
      description: "",
      default: {},
      options: [],
    };

    const addFieldsQs = additionalFields["queryString"];

    if (addFieldsQs) {
      Object.entries(addFieldsQs).forEach(([key, value]) =>
        outputAddFieldsQs.options.push(
          this.openApiQsParam(key, value, { required: false })
        )
      );
    }

    return outputAddFieldsQs.options.length ? outputAddFieldsQs : null;
  }

  private getAddFieldsRequestbody(operation: YamlOperation) {
    const { additionalFields } = operation;

    if (!additionalFields) return null;

    const addFieldsRb = additionalFields["requestBody"];

    if (!addFieldsRb) return null;

    return this.getRequestBody(addFieldsRb, { required: false });
  }
}
