import React from "react";
import Tabs from "../../components/util/Tabs";
import SelectQuestion from "./SelectQuestion";

const StatsManager = () => {
  return (
    <Tabs
      tabs={[
        {
          name: "Question",
          content: <SelectQuestion />,
        },
      ]}
    />
  );
};

export default StatsManager;
