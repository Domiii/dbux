import Enum from "../../util/Enum";

let VarOwnerType = {
  Context: 1,
  Trace: 2,
  Loop: 3
};
VarOwnerType = new Enum(VarOwnerType);

export default VarOwnerType;