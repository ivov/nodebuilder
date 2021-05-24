/**
 * Responsible for "staging" nodegen params (from a YAML source file)
 * so that they are ready for consumption by nodegen templates.
 */
export default class YamlStager {
  private inputMainParams: YamlMainPreparams;
  private outputMetaParams: MetaParams;
  private outputMainParams: MainParams = {};
  private currentResource = "";
  private outputOperation: Operation;

  constructor(yamlNodegenParams: YamlPreparams) {
    this.inputMainParams = yamlNodegenParams.mainParams;
    this.outputMetaParams = yamlNodegenParams.metaParams;
  }

  public run(): NodegenParams {
    this.initializeMainParams();

    this.loopOverInputOperations((inputOperation) => {
      this.initializeOutputOperation(inputOperation);
      this.populateOutputOperation(inputOperation);
    });

    this.unescapeHash();

    return {
      mainParams: this.outputMainParams,
      metaParams: this.outputMetaParams,
    };
  }

  private initializeMainParams() {
    this.getResources().forEach((resource) => {
      this.outputMainParams[resource] = [];
    });
  }

  private loopOverInputOperations(
    callback: (inputOperation: YamlOperation) => void
  ) {
    this.getResources().forEach((resource) => {
      this.currentResource = resource;
      this.inputMainParams[resource].forEach((inputOperation) =>
        callback(inputOperation)
      );
    });
  }

  private populateOutputOperation(inputOperation: YamlOperation) {
    const {
      requiredFields,
      additionalFields,
      filters,
      updateFields,
    } = inputOperation;

    // ----------------------------------
    //           path params
    // ----------------------------------

    const outputPathParams = this.pathParams(inputOperation);

    if (outputPathParams) this.outputOperation.parameters = outputPathParams;

    // ----------------------------------
    //       qs params (required)
    // ----------------------------------

    const outputQsParams = this.qsParams(requiredFields?.queryString, {
      required: true,
    });

    if (outputQsParams) this.outputOperation.parameters = outputQsParams;

    // ----------------------------------
    //         qs params (extra)
    // ----------------------------------

    // additional fields

    const outputQsAddFields = this.qsExtraFields(additionalFields, {
      name: "Additional Fields",
    });

    if (outputQsAddFields)
      this.outputOperation.additionalFields = outputQsAddFields;

    // filters

    const outputQsFilters = this.qsExtraFields(filters, {
      name: "Filters",
    });

    if (!this.outputOperation.parameters && outputQsFilters)
      this.outputOperation.parameters = outputQsFilters.options;

    if (this.outputOperation.parameters && outputQsFilters)
      this.outputOperation.parameters.push(...outputQsFilters.options);

    // update fields

    const outputQsUpdateFields = this.qsExtraFields(updateFields, {
      name: "Update Fields",
    });

    if (outputQsUpdateFields)
      this.outputOperation.updateFields = outputQsUpdateFields;

    // ----------------------------------
    //          request body
    // ----------------------------------

    const outputRequestBody = this.stageRequestBody(
      requiredFields?.requestBody,
      {
        required: true,
        name: "Standard",
      }
    );

    this.outputOperation.requestBody = outputRequestBody ?? [];

    // ----------------------------------
    //        request body (extra)
    // ----------------------------------

    this.rbExtraFields(additionalFields, { name: "Additional Fields" });
    this.rbExtraFields(filters, { name: "Filters" });
    this.rbExtraFields(updateFields, { name: "Update Fields" });

    this.outputMainParams[this.currentResource].push(this.outputOperation);
  }

  /**
   * Transfer `endpoint`, `requestMethod`, `operationId` and `operationUrl`
   * to the output operation to be populated.
   */
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

  /**
   * Handle an input operation's path params (if any) by forwarding them for staging.
   */
  private pathParams(inputOperation: YamlOperation) {
    if (!inputOperation.endpoint.match(/\{/)) return null;

    const pathParams = inputOperation.endpoint.match(/(?<={)(.*?)(?=})/g);

    if (!pathParams) return null;

    return pathParams.map((pathParam) =>
      this.stagePathParam(pathParam, inputOperation)
    );
  }

  /**
   * Handle an input operation's query string params (if any) by forwarding them for staging.
   */
  private qsParams(
    queryString: YamlFieldsContent | undefined,
    { required }: { required: boolean }
  ) {
    if (!queryString) return null;

    return Object.entries(queryString).map(([key, value]) =>
      this.stageQsParam(key, value, { required })
    );
  }

  private qsExtraFields(
    extraFields: YamlFields | undefined,
    { name }: { name: ExtraFieldName }
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
    extraFields: YamlFields | undefined,
    {
      name,
    }: {
      name: "Additional Fields" | "Filters" | "Update Fields";
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
    value: TypeAndDescription,
    { required }: { required: boolean }
  ) {
    const output: OperationParameter = {
      in: "query" as const,
      name: key,
      required,
      schema: {
        type: value.type,
        default: value.type,
      },
    };

    if (value.type === "options") {
      output.schema.default = value.enumItems![0]; // TODO: Remove non-null assertion operator
      output.schema.enumItems = value.enumItems;
    }

    if (value.description) {
      output.description = value.description;
    }

    return output;
  }

  public stageRequestBody(
    requestBody: YamlFieldsContent | undefined,
    {
      required,
      name,
    }: {
      required: boolean;
      name: "Standard" | "Additional Fields" | "Filters" | "Update Fields";
    }
  ) {
    if (!requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      name,
      required,
      content: {
        // TODO: add also `multipart/form-data` and `text/plain`
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    };

    const formUrlEncoded = "application/x-www-form-urlencoded";

    Object.entries(requestBody).forEach(([key, value]) => {
      const properties =
        outputRequestBody.content[formUrlEncoded]?.schema.properties;
      if (properties) {
        properties[key] = value;
      }
    });

    return [outputRequestBody];
  }

  /**
   * Remove `\` from `#` in the node color in the meta params in the YAML file.
   */
  private unescapeHash() {
    this.outputMetaParams.nodeColor = this.outputMetaParams.nodeColor.replace(
      "\\#",
      "#"
    );
  }

  /**
   * Return all the resource names of the API.
   */
  private getResources() {
    return Object.keys(this.inputMainParams);
  }
}
