import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { connect } from "react-redux";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const SelectCourse = (props: any) => {
  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
  ];
  return (
    <DataGrid
      columns={columns}
      rows={props.courses}
      pageSize={20}
      sx={{ border: 0 }}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  return { courses: selectors.courses(state) };
};

export default connect(mapStateToProps)(SelectCourse);
