// ----------------------------------
//            Printer
// ----------------------------------

type ApiMap = {
  [key: string]: ApiMapOperation[];
};

type ApiMapOperation = {
  ATTENTION?: string;
  nodeOperation: string;
  requestMethod;
  endpoint: string;
  IRREGULAR?: string;
};

type TreeView = string;
