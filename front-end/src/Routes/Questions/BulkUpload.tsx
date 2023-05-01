import { Box, Button, Modal } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { GridToolbarFilterButton } from "@mui/x-data-grid/components";
import { GridToolbarContainer } from "@mui/x-data-grid/components/containers/GridToolbarContainer";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { connect } from "react-redux";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import { create_questions } from "./actions";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineTwoToneIcon from "@mui/icons-material/CheckCircleOutlineTwoTone";
import RadioButtonUncheckedTwoToneIcon from "@mui/icons-material/RadioButtonUncheckedTwoTone";
import { TabContext } from "../../components/util/Tabs";
import { test_sample2 } from "./actions";
import store from "../../store";
import { convert_from_my_obj_to_erin_obj } from "../../helper";
import { erinObj, sample_verification_obj } from "../..";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "70%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  maxHeight: "70%",
  overflowY: "scroll",
};

const BulkUpload = (props: any) => {
  let fileReader: any;
  const [selectionModel, setSelectionModel] = useState([]);
  const [uploadedQuestions, setUploadedQuestions] = useState<any>([]);

  const handleFileRead = (e: any) => {
    const content = fileReader.result;
    let questions = JSON.parse(content);
    setUploadedQuestions(questions);
  };
  const handleFileChosen = (file: any) => {
    fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file);
  };

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
        <TabContext.Consumer>
          {(value) => {
            return (
              <Button
                onClick={() => {
                  for (let question of uploadedQuestions) {
                    if (!question.samples_consistent) return;
                  }
                  props.create_questions(uploadedQuestions, () =>
                    value.setValue(0)
                  );
                  setUploadedQuestions([]);
                }}
              >
                Create
              </Button>
            );
          }}
        </TabContext.Consumer>
        <Button
          color="error"
          onClick={() => {
            let questions = uploadedQuestions.filter((question: any) => {
              return !selectionModel.includes(question["id"] as never);
            });
            setUploadedQuestions(questions);
          }}
        >
          Delete
        </Button>
      </GridToolbarContainer>
    );
  };

  const grid = () => {
    const columns = [
      { field: "id", headerName: "ID", width: 200 },
      { field: "name", headerName: "Name", width: 200 },
      {
        field: "description",
        headerName: "Preview",
        width: 150,
        renderCell: (params: any) => {
          const [open, setOpen] = React.useState(false);
          const handleOpen = () => setOpen(true);
          const handleClose = () => setOpen(false);
          return (
            <>
              <Button onClick={handleOpen}>Preview</Button>
              <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={style}>
                  <ReactMarkdown
                    children={params.row.description}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                  />
                </Box>
              </Modal>
            </>
          );
        },
      },
      {
        field: "samples",
        headerName: "Test Samples",
        width: 150,
        renderCell: (params: any) => {
          return (
            <Button
              onClick={() => {
                let new_obj: erinObj = convert_from_my_obj_to_erin_obj(
                  params.row
                );
                store.dispatch<any>(
                  test_sample2(new_obj, (response: sample_verification_obj) => {
                    setUploadedQuestions(
                      uploadedQuestions.map((question: any) => {
                        if (question.id == params.row.id) {
                          if (response.containsConflicts) {
                            question.samples_consistent = false;
                          } else if (response.containsConflicts === false) {
                            question.samples_consistent = true;
                          }
                          return question;
                        } else {
                          return question;
                        }
                      })
                    );
                  })
                );
              }}
            >
              Test Samples
            </Button>
          );
        },
      },
      {
        field: "samples_status",
        headerName: "Sample Status",
        width: 150,
        renderCell: (params: any) => {
          if (params.row.samples_consistent === undefined) {
            return (
              <RadioButtonUncheckedTwoToneIcon
                className="m-auto"
                color="error"
              />
            );
          } else if (params.row.samples_consistent === false) {
            return <CancelOutlinedIcon className="m-auto" color="error" />;
          } else {
            return (
              <CheckCircleOutlineTwoToneIcon
                className="m-auto"
                color="success"
              />
            );
          }
        },
      },
    ];

    return (
      <DataGrid
        columns={columns}
        rows={uploadedQuestions}
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

export default connect(null, { create_questions })(BulkUpload);
