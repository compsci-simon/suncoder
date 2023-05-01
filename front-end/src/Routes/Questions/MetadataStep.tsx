import { List, ListItemButton } from "@mui/material";
import React, { useState } from "react";
import { FormProps } from "react-final-form";
import CallsStep from "./CallsStep";
import ImportsComponent from "./ImportsComponent";
import OperatorsStep from "./OperatorsStep";
import StructuresComponent from "./StructuresComponent";
import CategoriesComponent from "./CategoriesComponent";
import Feedback from "./Feedback";
import Other from "./Other";

type metadataStepProps = {
  formProps: FormProps;
};
const MetadataStep = ({ formProps }: metadataStepProps) => {
  if (!formProps) return null;
  const [selectedItem, _setSelectedItem] = useState("Imports");
  const setSelectedItem = (e: any) => _setSelectedItem(e.target.innerText);
  let shownProp: React.ReactElement | null;
  switch (selectedItem) {
    case "Operators":
      shownProp = <OperatorsStep />;
      break;
    case "Callable":
      shownProp = <CallsStep />;
      break;
    case "Structures":
      shownProp = <StructuresComponent formProps={formProps} />;
      break;
    case "Categories":
      shownProp = <CategoriesComponent />;
      break;
    case "Feedback":
      shownProp = <Feedback />;
      break;
    case "Other":
      shownProp = <Other />;
      break;
    default:
      shownProp = <ImportsComponent formProps={formProps} />;
      break;
  }
  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <div style={{ width: 200, height: "100%" }}>
        <List>
          <ListItemButton
            selected={selectedItem == "Imports"}
            onClick={setSelectedItem}
          >
            Imports
          </ListItemButton>
          <ListItemButton
            selected={selectedItem == "Operators"}
            onClick={setSelectedItem}
          >
            Operators
          </ListItemButton>
          <ListItemButton
            selected={selectedItem == "Callable"}
            onClick={setSelectedItem}
          >
            Callable
          </ListItemButton>
          <ListItemButton
            selected={selectedItem == "Structures"}
            onClick={setSelectedItem}
          >
            Structures
          </ListItemButton>
          <ListItemButton
            selected={selectedItem == "Categories"}
            onClick={setSelectedItem}
          >
            Categories
          </ListItemButton>
          <ListItemButton
            selected={selectedItem == "Feedback"}
            onClick={setSelectedItem}
          >
            Feedback
          </ListItemButton>
          <ListItemButton
            selected={selectedItem == "Other"}
            onClick={setSelectedItem}
          >
            Other
          </ListItemButton>
        </List>
      </div>
      <div
        style={{
          flexGrow: 2,
          height: "100%",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 15, right: 15 }}>
          {shownProp}
        </div>
      </div>
    </div>
  );
};

export default MetadataStep;
