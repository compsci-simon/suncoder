import React from "react";

import Tabs from "../../components/util/Tabs";
import CreateUnit from "./CreateUnit";
import UnitFeed from "./UnitFeed";
import "./units.css";

const UnitManager = () => {
  return (
    <Tabs
      tabs={[
        {
          name: "Edit Unit",
          content: <UnitFeed />,
        },
        {
          name: "Create Unit",
          content: <CreateUnit submit={() => {}} />,
        },
      ]}
    />
  );
};

export default UnitManager;
