import Enum from "../../util/Enum";

// eslint-disable-next-line import/no-mutable-exports
let VarOwnerType = {
  Context: 1,
  Trace: 2,
  Loop: 3
};
VarOwnerType = new Enum(VarOwnerType);

export default VarOwnerType;