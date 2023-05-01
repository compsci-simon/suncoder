import { List, ListItemButton, Typography } from "@mui/material";
import React, { useState } from "react";
import CheckCircleOutlineTwoToneIcon from "@mui/icons-material/CheckCircleOutlineTwoTone";
import { Stack } from "@mui/system";

const ResponseContent = (props: any) => {
  let test_results: any = props.test_results;
  const [selectedItem, _setSelectedItem] = useState("Concepts");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const setSelectedItem = (e: any, index: number) => {
    _setSelectedItem(e.target.innerText);
    setSelectedIndex(index);
  };
  if (!test_results) return null;
  else if (!test_results["containsConflicts"]) {
    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ width: 100, display: "flex", flexDirection: "row" }}>
          <Typography>Consistent: </Typography>{" "}
          <CheckCircleOutlineTwoToneIcon color="success" />
        </div>
        <div style={{ flexGrow: 2 }}></div>
      </div>
    );
  } else {
    let displayComponent: any = <Typography>Nothing</Typography>;
    switch (selectedItem) {
      case "Operators":
        if (test_results["operator consistency"].length == 0) {
          displayComponent = (
            <CheckCircleOutlineTwoToneIcon fontSize="large" color="success" />
          );
        } else {
          displayComponent = (
            <Typography>{test_results["operator consistency"]}</Typography>
          );
        }
        break;
      case "Structure":
        if (
          test_results["solution consistency"]["required"].length == 0 &&
          test_results["solution consistency"]["illegal"].length == 0
        ) {
          displayComponent = (
            <CheckCircleOutlineTwoToneIcon fontSize="large" color="success" />
          );
        } else {
          console.log(test_results["solution consistency"]);
          displayComponent = (
            <Stack>
              <Typography display="block">
                Required structures: [
                {test_results["solution consistency"]["required"].toString()}]
              </Typography>
              <Typography display="block">
                Illegal structures: [
                {test_results["solution consistency"]["illegal"].toString()}]
              </Typography>
            </Stack>
          );
        }
        break;
      case "Outputs":
        if (
          test_results["solution outputs"]["failed"].length == 0 &&
          test_results["solution outputs"]["errors"].length == 0
        ) {
          displayComponent = (
            <CheckCircleOutlineTwoToneIcon fontSize="large" color="success" />
          );
        } else {
          displayComponent = (
            <Stack>
              <Typography display="block">
                Test cases failed: [
                {test_results["solution outputs"]["failed"].toString()}]
              </Typography>
              <Typography display="block">
                Test cases with errors: [
                {test_results["solution outputs"]["errors"].toString()}]
              </Typography>
            </Stack>
          );
        }
        break;
      default:
        if (test_results["required and illegal concepts"].length == 0) {
          displayComponent = (
            <CheckCircleOutlineTwoToneIcon fontSize="large" color="success" />
          );
        } else {
          displayComponent = (
            <Typography>
              {test_results["required and illegal concepts"]}
            </Typography>
          );
        }
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "100%",
          width: "100%",
        }}
      >
        <div style={{ width: 100, height: "100%" }}>
          <List>
            <ListItemButton
              selected={selectedIndex == 0}
              onClick={(e) => setSelectedItem(e, 0)}
            >
              Concepts
            </ListItemButton>
            <ListItemButton
              selected={selectedIndex == 1}
              onClick={(e) => setSelectedItem(e, 1)}
            >
              Operators
            </ListItemButton>
            <ListItemButton
              selected={selectedIndex == 2}
              onClick={(e) => setSelectedItem(e, 2)}
            >
              Structure
            </ListItemButton>
            <ListItemButton
              selected={selectedIndex == 3}
              onClick={(e) => setSelectedItem(e, 3)}
            >
              Outputs
            </ListItemButton>
          </List>
        </div>
        <div
          style={{
            flexGrow: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid black",
          }}
        >
          {displayComponent}
        </div>
      </div>
    );
  }
};

export default ResponseContent;
