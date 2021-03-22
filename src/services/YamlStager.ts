import { printStagedParams } from "../utils/FilePrinter";

/**
 * Responsible for staging output params for consumption by nodegen templates,
 * based on a YAML-to-JSON translation as input.
 */
export default class YamlStager {
  private inputMainParams: YamlMainParams;
  private outputMetaParams: MetaParams;
  private outputMainParams: MainParams = {};
  private currentResource = "";
  private outputOperation: Operation;

  constructor(yamlNodegenParams: YamlNodegenParams) {
    this.inputMainParams = yamlNodegenParams.mainParams;
    this.outputMetaParams = yamlNodegenParams.metaParams;
  }

  public run(): NodegenParams {
    this.initializeOutputParams();
    this.populateOutputParams();

    printStagedParams(this.outputMainParams); // TEMP

    return {
      mainParams: this.outputMainParams,
      metaParams: this.outputMetaParams,
    };
  }

  private initializeOutputParams() {
    Object.keys(this.inputMainParams).forEach((key) => {
      this.outputMainParams[key] = [];
    });
  }

  private iterateOverOperations(callback: (operation: YamlOperation) => void) {
    Object.keys(this.inputMainParams).forEach((resource) => {
      this.currentResource = resource;
      const operationsPerResource = this.inputMainParams[resource];
      operationsPerResource.forEach((operation) => callback(operation));
    });
  }

  private populateOutputParams() {
    this.iterateOverOperations((inputOperation: YamlOperation) => {
      this.initializeOutputOperation(inputOperation);

      const {
        endpoint,
        queryString,
        additionalFields: addFields,
        filterFields,
        updateFields,
        requestBody,
      } = inputOperation;

      // ----------------------------------
      //       populate path params
      // ----------------------------------

      const outputPathParams = this.pathParams(inputOperation);
      if (outputPathParams) this.outputOperation.parameters = outputPathParams;

      // ----------------------------------
      //       populate qs params
      // ----------------------------------

      const outputQsParams = this.qsParams(queryString, { required: true });
      if (outputQsParams) this.outputOperation.parameters = outputQsParams;

      // ----------------------------------
      //     populate qs extra params
      // ----------------------------------

      const outputQsAddFields = this.qsExtraFields(addFields, {
        name: "Additional Fields",
      });

      if (outputQsAddFields)
        this.outputOperation.additionalFields = outputQsAddFields;

      const outputQsFilters = this.qsExtraFields(filterFields, {
        name: "Filter Fields",
      });

      if (outputQsFilters) this.outputOperation.filterFields = outputQsFilters;

      const outputQsUpdateFields = this.qsExtraFields(updateFields, {
        name: "Update Fields",
      });

      if (outputQsUpdateFields)
        this.outputOperation.updateFields = outputQsUpdateFields;

      // ----------------------------------
      //      populate request body
      // ----------------------------------

      const outputRequestBody = this.stageRequestBody(requestBody, {
        required: true,
        name: "Standard",
      });

      this.outputOperation.requestBody = outputRequestBody || [];

      // ----------------------------------
      //      populate rb extra fields
      // ----------------------------------

      this.rbExtraFields(addFields, { name: "Additional Fields" });
      this.rbExtraFields(filterFields, { name: "Filter Fields" });
      this.rbExtraFields(updateFields, { name: "Update Fields" });

      this.outputMainParams[this.currentResource].push(this.outputOperation);
    });
  }

  private initializeOutputOperation({
    endpoint,
    requestMethod,
    operationId,
    operationUrl,
  }: YamlOperation) {
    this.outputOperation = {
      endpoint,
      requestMethod,
      operationId,
    };

    if (operationUrl) this.outputOperation.operationUrl = operationUrl;
  }

  private pathParams(inputOperation: YamlOperation) {
    if (!inputOperation.endpoint.match(/\{/)) return null;

    const pathParams = inputOperation.endpoint.match(/(?<={)(.*?)(?=})/g);

    if (!pathParams) return null;

    return pathParams.map((pp) => this.stagePathParam(pp, inputOperation));
  }

  private qsParams(
    queryString: YamlOperation["queryString"],
    { required }: { required: boolean }
  ) {
    if (!queryString) return null;

    return Object.entries(queryString).map(([key, value]) =>
      this.stageQsParam(key, value, { required })
    );
  }

  private qsExtraFields(
    extraFields: ExtraFields | undefined,
    {
      name,
    }: {
      name: "Additional Fields" | "Filter Fields" | "Update Fields";
    }
  ) {
    if (!extraFields) return null;

    const qsExtraFields = extraFields.queryString;
    if (!qsExtraFields) return null;

    const output: AdditionalFields = {
      name,
      type: "collection",
      description: "",
      default: {},
      options: [],
    };

    Object.entries(qsExtraFields).forEach(([key, value]) =>
      output.options.push(this.stageQsParam(key, value, { required: false }))
    );

    return output.options.length ? output : null;
  }

  private rbExtraFields(
    extraFields: ExtraFields | undefined,
    {
      name,
    }: {
      name: "Additional Fields" | "Filter Fields" | "Update Fields";
    }
  ) {
    const rbExtraFields = this.stageRequestBody(extraFields?.requestBody, {
      required: false,
      name,
    });

    if (rbExtraFields) {
      // TODO: Remove casting
      (this.outputOperation.requestBody as OperationRequestBody[]).push(
        ...rbExtraFields
      );
    }
  }

  private stagePathParam(pathParam: string, { operationId }: YamlOperation) {
    const output: OperationParameter = {
      in: "path" as const,
      name: pathParam,
      schema: {
        type: "string",
        default: "",
      },
      required: true,
    };

    let description = `ID of the ${this.currentResource} to `;

    if (
      operationId === "create" ||
      operationId === "update" ||
      operationId === "delete"
    ) {
      output.description = description + operationId + ".";
    } else if (operationId === "get") {
      output.description = description + "retrieve.";
    }

    return output;
  }

  private stageQsParam(
    key: string,
    value: { type: string; description?: string }, // TODO: Type properly
    { required }: { required: boolean }
  ) {
    const output: OperationParameter = {
      in: "query" as const,
      name: key,
      required,
      schema: {
        type: value.type,
        default: this.getDefault(value.type),
      },
    };

    if (value.description) {
      output.description = value.description;
    }

    return output;
  }

  public stageRequestBody(
    requestBody: YamlOperation["requestBody"],
    {
      required,
      name,
    }: {
      required: boolean;
      name:
        | "Standard"
        | "Additional Fields"
        | "Filter Fields"
        | "Update Fields";
    }
  ) {
    if (!requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      // TODO: add other types: `multipart/form-data` and `text/plain`
      name,
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

    return [outputRequestBody];
  }

  private getDefault(type: string) {
    if (type === "boolean") return false;
    if (type === "number") return 0;
    return "";
  }
}
