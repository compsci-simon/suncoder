import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { connect } from "react-redux";

import { enroll } from "./actions";
import { Button, Chip, Tooltip } from "@mui/material";
import { selectors } from "../../orm/orm";

const CourseRegistration = (props: any) => {
  return (
    <div className="h-100">
      <DataGrid
        columns={[
          { field: "id", headerName: "ID", width: 100 },
          { field: "name", headerName: "Name" },
          {
            field: "prerequisites",
            headerName: "Prerequisites",
            renderCell(params: any) {
              return params.row.prerequisites.map(
                (item: any, index: number) => {
                  return <Chip key={index} label={item.name} />;
                }
              );
            },
          },
          {
            field: "enroll",
            headerName: "Enroll",
            width: 100,
            renderCell(params: any) {
              if (params.row["can_enroll"]) {
                return (
                  <Button onClick={() => props.enroll(params.row["id"])}>
                    Enroll
                  </Button>
                );
              } else {
                return (
                  <Tooltip
                    title={params.row["enroll_msg"]}
                    placement="top-start"
                    children={
                      <span>
                        <Button disabled>Enroll</Button>
                      </span>
                    }
                    arrow
                  />
                );
              }
            },
          },
          {
            field: "status",
            headerName: "Status",
          },
        ]}
        rows={props.courses}
        pageSize={10}
        rowsPerPageOptions={[10]}
        sx={{ border: 0 }}
      />
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    courses: selectors.courses_reg(state),
  };
};

export default connect(mapStateToProps, {
  enroll,
})(CourseRegistration);
