import React from "react";
import UnitEditor from "./UnitEditor";
import { connect } from "react-redux";

import { create_unit } from "./actions";
import { unit } from "../../apis";
import { TabContext } from "../../components/util/Tabs";

const CreateUnit = (props: any) => {
  return (
    <TabContext.Consumer>
      {(value) => {
        return (
          <UnitEditor
            buttonText="Create unit"
            unit={{
              id: -1,
              name: "",
              categories: [],
              pools: [],
              questions: [],
              usePools: false,
            }}
            submit={(unit: unit) => {
              props.create_unit(unit, () => {
                value.setValue(0);
              });
            }}
          />
        );
      }}
    </TabContext.Consumer>
  );
};

export default connect(null, { create_unit })(CreateUnit);
