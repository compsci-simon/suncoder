import React from "react";
import { Paper, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { connect } from "react-redux";

import history from "../../history";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const QuestionStats = (props: any) => {
  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "username", headerName: "Username", width: 90 },
    {
      field: "link",
      headerName: "View",
      minWidth: 150,
      renderCell: (params: any) => (
        <Button
          color="primary"
          size="small"
          style={{ marginLeft: 16 }}
          onClick={() => {
            history.push(
              `${props.location.pathname}/user_code/${params.row.id}`
            );
          }}
        >
          User Code
        </Button>
      ),
    },
  ];
  return (
    <div className="h-100 w-100">
      <DataGrid
        rows={props.attemps}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        sx={{ border: 0 }}
      />
    </div>
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  let qid = ownProps.match.params.question_id;
  return {
    attemps: selectors.user_attempts_for_question(state, qid),
    question: selectors.question(state, qid),
  };
};

export default connect(mapStateToProps, {})(QuestionStats);
