import OpenApiCreator from "./OpenApiCreator";
import { printStagedParams } from "./FilePrinter";

/**
 * Stages output params for consumption by nodegen templates, based on a YAML-to-JSON translation as input.
 */
export default class YamlStager {
  private outputMainParams: MainParams = {};
  private currentResource = "";
  private outputOperation: Operation;

  constructor(private inputMainParams: YamlMainParams) {}

  public run() {
    this.initializeOutputParams();
    this.populateOutputParams();

    printStagedParams(this.outputMainParams); // TEMP

    return this.outputMainParams;
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

      const outputPathParams = this.pathParams(endpoint);
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

      const outputRequestBody = OpenApiCreator.requestBody(requestBody, {
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

  private pathParams(endpoint: string) {
    if (!endpoint.match(/\{/)) return null;

    const pathParams = endpoint.match(/(?<={)(.*?)(?=})/g);

    if (!pathParams) return null;

    return pathParams.map(OpenApiCreator.pathParam);
  }

  private qsParams(
    queryString: YamlOperation["queryString"],
    { required }: { required: boolean }
  ) {
    if (!queryString) return null;

    return Object.entries(queryString).map(([key, value]) =>
      OpenApiCreator.qsParam(key, value, { required })
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
      output.options.push(
        OpenApiCreator.qsParam(key, value, { required: false })
      )
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
    const rbExtraFields = OpenApiCreator.requestBody(extraFields?.requestBody, {
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
}
