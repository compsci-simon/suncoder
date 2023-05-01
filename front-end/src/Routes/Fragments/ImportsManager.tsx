import React from "react";
import { connect } from "react-redux";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

import { delete_object } from "../../action";
import FragmentManager from "./FragmentManager";

const ImportsManager = (props: any) => {
  const deleteImport = (import_object: { name: string }) => {
    props.delete_object("imports", [import_object]);
  };

  return (
    <FragmentManager
      fragments={props.imports}
      fragment_name="Import"
      tablename="imports"
      deleteFragment={deleteImport}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  return { imports: selectors.imports(state) };
};

export default connect(mapStateToProps, {
  delete_object,
})(ImportsManager);
