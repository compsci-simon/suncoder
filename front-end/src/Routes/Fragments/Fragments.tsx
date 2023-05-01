import React from "react";
import Tabs from "../../components/util/Tabs";
import CategoriesEditor from "./CategoriesEditor";
import ImportsManager from "./ImportsManager";
import ProgrammingStructuresManager from "./ProgrammingStructuresManager";

const Fragments = () => {
  return (
    <Tabs
      tabs={[
        {
          name: "Categories",
          content: <CategoriesEditor />,
        },
        {
          name: "Imports",
          content: <ImportsManager />,
        },
        {
          name: "Structures",
          content: <ProgrammingStructuresManager />,
        },
      ]}
    />
  );
};

export default Fragments;
