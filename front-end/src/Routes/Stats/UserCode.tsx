import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { connect } from "react-redux";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";
import { formatDate } from "./helper";

const UserCode = (props: any) => {
  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "date",
      headerName: "Date",
      minWidth: 200,
      renderCell: (params: any) => {
        return formatDate(params.row.date);
      },
    },
    {
      field: "test_cases_passed",
      headerName: "Test cases passed",
      renderCell: (params: any) => {
        return `${params.row.cases_passed}/${params.row.total_cases}`;
      },
    },
    {
      field: "view",
      headerName: "View",
      renderCell: (params: any) => {
        return (
          <Button
            size="small"
            onClick={() =>
              props.history.push(
                `${props.location.pathname}/code_run/${params.row.id}`
              )
            }
          >
            View
          </Button>
        );
      },
    },
  ];
  return (
    <div className="w-100 h-100">
      <DataGrid
        columns={columns}
        rows={props.code_runs}
        density="compact"
        pageSize={20}
      />
    </div>
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    code_runs: selectors.code_runs(state, ownProps.match.params.user_code_id),
  };
};

export default connect(mapStateToProps, null)(UserCode);
