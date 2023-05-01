import React, { useState } from "react";
import { Button, Chip } from "@mui/material";
import { connect } from "react-redux";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { selectors } from "../../orm/orm";

import { delete_courses } from "./actions";
import history from "../../history";
import store, { RootState } from "../../store";
import { delete_object } from "../../action";

const CourseFeed = (props: any) => {
  const [selectionModel, setSelectionModel] = useState([]);

  const dataGrid = () => {
    const columns = [
      { field: "id", headerName: "ID", type: "number" },
      { field: "name", headerName: "Name", width: 100 },
      {
        field: "prerequisites",
        headerName: "Prerequisites",
        width: 200,
        renderCell: (params: any) => {
          const chips = params.row.prerequisites.map(
            (prerequisite: any, index: number) => {
              return (
                <Chip key={index} label={prerequisite.name} className="mr-2" />
              );
            }
          );
          return <div className="overflow-box">{chips}</div>;
        },
      },
      {
        field: "units",
        headerName: "Units",
        width: 200,
        renderCell: (params: any) => {
          if (!params.row.units) return null;
          let units = Object.values(params.row.units);
          return (
            <div className="overflow-box">
              {units.map((unit: any, index) => {
                return <Chip key={index} label={unit.name} className="mr-2" />;
              })}
            </div>
          );
        },
      },
      {
        field: "edit",
        headerName: "Edit",
        width: 150,
        renderCell: (params: any) => {
          return (
            <Button
              onClick={() => history.push(`/courses/${params.row.id}/edit`)}
            >
              Edit
            </Button>
          );
        },
      },
    ];
    const gridToolBar = () => {
      return (
        <GridToolbarContainer>
          <GridToolbarFilterButton />
          <Button
            color="error"
            onClick={() => {
              let structured_ids = selectionModel.map((item) => {
                return { id: item };
              });
              store.dispatch<any>(delete_object("courses", structured_ids));
            }}
          >
            Delete
          </Button>
        </GridToolbarContainer>
      );
    };

    return (
      <div className="h-100">
        <DataGrid
          sx={{
            border: 0,
          }}
          rows={props.courses ? props.courses : []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          disableSelectionOnClick
          components={{ Toolbar: gridToolBar }}
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelection: any) => {
            setSelectionModel(newSelection);
          }}
        />
      </div>
    );
  };

  return dataGrid();
};

const mapStateToProps = (state: RootState) => {
  return { courses: selectors.courses(state) };
};

export default connect(mapStateToProps, {
  delete_courses,
})(CourseFeed);
