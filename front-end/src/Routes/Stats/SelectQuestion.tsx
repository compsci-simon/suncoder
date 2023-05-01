import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { connect } from "react-redux";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";
import history from "../../history";

const SelectQuestion = (props: any) => {
  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name", width: 150 },
    {
      field: "view",
      headerName: "User Codes",
      minWidth: 150,
      renderCell: (params: any) => {
        return (
          <Button
            onClick={() =>
              history.push(`${history.location.pathname}/${params.row.id}`)
            }
          >
            User Codes
          </Button>
        );
      },
    },
    {
      field: 'attempts',
      headerName: 'Attempts',
    },
    {
      field: "report",
      headerName: "Report",
      renderCell: (params: any) => {
        return (
          <Button
            onClick={() =>
              history.push(
                `${history.location.pathname}/${params.row.id}/chart`
              )
            }
          >
            Report
          </Button>
        );
      },
    },
  ];
  return (
    <DataGrid
      columns={columns}
      rows={props.questions}
      pageSize={20}
      sx={{ border: 0 }}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  return { questions: selectors.questions(state) };
};

export default connect(mapStateToProps, {})(SelectQuestion);
