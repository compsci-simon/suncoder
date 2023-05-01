import React from "react";
import { connect } from "react-redux";

import { update_unit } from "./actions";
import UnitEditor from "./UnitEditor";
import history from "../../history";
import { selectors } from "../../orm/orm";

const EditUnit = (props) => {
  if (props.unit == null) {
    return <h3>No unit</h3>;
  }

  return (
    <UnitEditor
      title="Edit unit"
      buttonText="Edit unit"
      unit={props.unit}
      submit={(unit) => {
        props.update_unit(unit, () => {
          history.push("/units");
        });
      }}
    />
  );
};

const mapStateToProps = (state, ownProps) => {
  const unitId = ownProps.match.params.unitId;
  let unit = selectors.unit(state, unitId);
  if (unit.questions.length != unit.pools.length) {
    unit.usePools = true;
  } else {
    unit.usePools = false;
  }
  unit.numPools = unit.pools.length;
  return { unit };
};

export default connect(mapStateToProps, {
  update_unit,
})(EditUnit);
