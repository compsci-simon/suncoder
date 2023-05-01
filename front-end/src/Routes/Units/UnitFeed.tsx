import React, { useState } from "react";
import { Button, Chip } from "@mui/material";
import { connect } from "react-redux";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";

import { delete_units } from "./actions";
import history from "../../history";
import { selectors } from "../../orm/orm";
import store, { RootState } from "../../store";
import "../../components/App.css";
import { delete_object } from "../../action";

const UnitFeed = (props: any) => {
  const [selectionModel, setSelectionModel] = useState([]);

  const dataGrid = () => {
    const columns = [
      { field: "id", headerName: "ID", type: "number" },
      { field: "name", headerName: "Name", width: 100 },
      {
        field: "categories",
        headerName: "Categories",
        width: 200,
        renderCell: (params: any) => {
          const chips = params.row.categories.map(
            (category: any, index: number) => {
              return (
                <Chip key={index} label={category.name} className="mr-2" />
              );
            }
          );
          return <div className="overflow-box">{chips}</div>;
        },
      },
      {
        field: "course",
        headerName: "Course",
        width: 150,
        renderCell: (params: any) => {
          if (!params.row.course)
            return <Chip color="warning" label="Unassigned" />;
          return <Chip label={params.row.course.name} />;
        },
      },
      {
        field: "edit",
        headerName: "Edit",
        width: 150,
        renderCell: (params: any) => {
          return (
            <Button onClick={() => history.push(`/units/${params.row.id}`)}>
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
              let structured_model = selectionModel.map((item) => {
                return { id: item };
              });
              store.dispatch<any>(delete_object("units", structured_model));
            }}
          >
            Delete
          </Button>
        </GridToolbarContainer>
      );
    };

    return (
      <div className="h-100 w-100">
        <DataGrid
          sx={{
            border: 0,
          }}
          rows={props.units}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[10]}
          checkboxSelection
          disableSelectionOnClick
          components={{ Toolbar: gridToolBar }}
          onSelectionModelChange={(newSelection: any) => {
            setSelectionModel(newSelection);
          }}
          selectionModel={selectionModel}
        />
      </div>
    );
  };

  const renderUnits = () => {
    return dataGrid();
  };

  return renderUnits();
};

const mapStateToProps = (state: RootState) => {
  return { units: selectors.units(state) };
};

export default connect(mapStateToProps, { delete_units })(UnitFeed);
