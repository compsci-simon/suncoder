import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { GridToolbarFilterButton } from "@mui/x-data-grid/components";
import { GridToolbarContainer } from "@mui/x-data-grid/components/containers/GridToolbarContainer";
import React, { useContext, useState } from "react";
import { connect } from "react-redux";
import { create_users } from "./actions";
import { TabContext } from "../../components/util/Tabs";
import { create_object } from "../../action";
import store from "../../store";

const BulkUserOps = (props: any) => {
  let fileReader: any;
  const [selectionModel, setSelectionModel] = useState([]);
  const [uploadedUsers, setUploadedUsers] = useState<any>([]);
  const contextValue = useContext(TabContext);

  const handleFileRead = (e: any) => {
    console.log("here");
    const content = fileReader.result;
    let users = JSON.parse(content);
    for (let user of users) {
      user.id = crypto.randomUUID().replaceAll("-", "");
    }
    console.log(users);
    // let users = content.split("\n");
    // users = users.map((item: any, index: number) => {
    //   let parts = item.split(",");
    //   if (parts[0] != "" && parts[1] != "") {
    //     return { id: index, username: parts[0], type: parts[1] };
    //   }
    // });
    // users = users.filter((x: any) => x);
    setUploadedUsers(users);
  };
  const handleFileChosen = (file: any) => {
    fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file);
  };

  const grid = () => {
    const gridToolbar = () => {
      return (
        <GridToolbarContainer>
          <GridToolbarFilterButton />
          <Button component="label">
            Load
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e: any) => handleFileChosen(e.target.files[0])}
            />
          </Button>
          <Button
            color="error"
            onClick={() => {
              let users: any = uploadedUsers.filter((user: any) => {
                return !selectionModel.includes(user["id"] as never);
              });
              users = users.map((user: any) => {
                user['password'] = '12345678'
                return user
              })
              setUploadedUsers(users);
            }}
          >
            Delete
          </Button>
          <Button
            onClick={() => {
              store.dispatch<any>(create_object("users", uploadedUsers));
              setUploadedUsers([]);
              contextValue.setValue(0);
            }}
          >
            Create
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
        rows={uploadedUsers}
        pageSize={20}
        rowsPerPageOptions={[20]}
        checkboxSelection
        disableSelectionOnClick
        components={{ Toolbar: gridToolbar }}
        selectionModel={selectionModel}
        onSelectionModelChange={(newSelection: any) => {
          setSelectionModel(newSelection);
        }}
        sx={{ border: 0 }}
      />
    );
  };

  return grid();
};

export default connect(null, {
  create_users,
})(BulkUserOps);
