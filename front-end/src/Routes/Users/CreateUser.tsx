import React, { useState } from "react";
import { Button, FormControl, FormLabel, MenuItem, Stack } from "@mui/material";
import { connect } from "react-redux";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { Form } from "react-final-form";
import { TextField, Select } from "mui-rff";
import setFieldTouched from "final-form-set-field-touched";

import { selectors } from "../../orm/orm";
import store, { RootState } from "../../store";
import { create_object, delete_object } from "../../action";

const CreateUser = (props: any) => {
  const [selectionModel, setSelectionModel] = useState<number[]>([]);

  const grid = () => {
    if (!props.users) return;

    const gridToolbar = () => {
      return (
        <GridToolbarContainer>
          <GridToolbarFilterButton />
          <Button
            color="error"
            onClick={() => {
              let structured_ids_to_delete = selectionModel.map((item) => {
                return { id: item };
              });
              store.dispatch<any>(
                delete_object("users", structured_ids_to_delete)
              );
            }}
          >
            Delete
          </Button>
        </GridToolbarContainer>
      );
    };

    const columns = [
      { field: "id", headerName: "ID", width: 200 },
      { field: "username", headerName: "Username", width: 200 },
      { field: "type", headerName: "User type", width: 200 },
    ];

    return (
      <DataGrid
        columns={columns}
        rows={props.users}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableSelectionOnClick
        components={{ Toolbar: gridToolbar }}
        selectionModel={selectionModel}
        onSelectionModelChange={(newSelection: any) => {
          setSelectionModel(newSelection);
        }}
      />
    );
  };

  const validate = (values: any) => {
    let errors: any = {};
    if (!values.username) {
      errors["username"] = "Username required";
    }
    if (!values.type) {
      errors["type"] = "Select user type";
    }
    return errors;
  };

  return (
    <div className="p-3">
      <Form
        mutators={{ setFieldTouched }}
        onSubmit={(user: any) =>
          store.dispatch<any>(create_object("users", [{ ...user, password: '12345678' }]))
        }
        validate={validate}
        render={({ handleSubmit, form }) => (
          <form onSubmit={handleSubmit}>
            <Stack direction="column" spacing={2}>
              <FormControl>
                <FormLabel>Create User</FormLabel>
              </FormControl>
              <FormControl>
                <TextField
                  label="Username"
                  autoComplete="off"
                  name="username"
                />
              </FormControl>
              <FormControl>
                <Select label="Type" name="type">
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="lecturer">Lecturer</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <Button
                  type="submit"
                  variant="outlined"
                  onClick={() => setTimeout(form.reset, 100)}
                >
                  Create user
                </Button>
              </FormControl>
              <div style={{ height: "400px", width: "100%" }}>{grid()}</div>
            </Stack>
          </form>
        )}
      />
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return { users: selectors.users(state) };
};

export default connect(mapStateToProps, {})(CreateUser);
