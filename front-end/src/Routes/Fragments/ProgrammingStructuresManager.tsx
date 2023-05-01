import React from "react";
import FragmentManager from "./FragmentManager";
import { connect } from "react-redux";

import { delete_object } from "../../action";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const ProgrammingStructuresManager = (props: any) => {
  const delete_structure = (structure: { name: string }) => {
    props.delete_object("structures", [structure]);
  };

  return (
    <FragmentManager
      fragments={props.structures}
      fragment_name={"Structure"}
      tablename="structures"
      deleteFragment={delete_structure}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  return { structures: selectors.structures(state) };
};

export default connect(mapStateToProps, {
  delete_object,
})(ProgrammingStructuresManager);
