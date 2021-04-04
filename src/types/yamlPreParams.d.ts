// ----------------------------------
//          YAML preparams
// ----------------------------------

type YamlPreparams = {
  metaParams: MetaParams;
  mainParams: YamlMainPreparams;
};

type YamlMainPreparams = {
  [key: string]: YamlOperation[];
};

type YamlOperation = {
  operationId: string;
  requestMethod: string;
  endpoint: string;

  operationUrl?: string;
  requiredFields?: YamlFields;
  additionalFields?: YamlFields;
  filters?: YamlFields;
  updateFields?: YamlFields;
};

type YamlFields = {
  queryString?: YamlFieldsContent;
  requestBody?: YamlFieldsContent;
};

type YamlFieldsContent = {
  [name: string]: TypeAndDescription;
};
