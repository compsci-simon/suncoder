import React, { useState } from "react";
import { Button, Tooltip, Modal, Box, Chip, Typography } from "@mui/material";
import { connect } from "react-redux";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import history from "../../history";
import { fetch_questions, delete_questions } from "./actions";
import "./question.css";
import { selectors } from "../../orm/orm";
import store, { RootState } from "../../store";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { delete_object } from "../../action";
import { Stack } from "@mui/system";

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

const QuestionFeed = (props: any) => {
  const [selectionModel, setSelectionModel] = useState([]);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
            store.dispatch<any>(
              delete_object("questions", structured_ids, handleOpen)
            );
          }}
        >
          Delete
        </Button>
      </GridToolbarContainer>
    );
  };

  const dataGrid = () => {
    const columns = [
      { field: "id", headerName: "ID", type: "number" },
      {
        field: "name",
        headerName: "Name",
        width: 150,
        renderCell: (params: any) => {
          return (
            <Tooltip title={params.row.name} placement="top-start">
              <span className="cell">{params.row.name}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "categories",
        headerName: "Categories",
        width: 200,
        renderCell: (params: any) => {
          const content = params.row.categories.map(
            (category: any, index: number) => {
              return <Chip key={index} label={category.name} className="m-2" />;
            }
          );
          return <div style={{ display: "flex" }}>{content}</div>;
        },
      },
      {
        field: "creator",
        headerName: "Creator",
        width: 150,
        renderCell: (params: any) => {
          return params.row.creator ? params.row.creator.username : null;
        },
      },
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
        field: "edit",
        headerName: "Edit",
        width: 80,
        sortable: false,
        renderCell: (params: any) => {
          return (
            <Button onClick={() => history.push(`/questions/${params.row.id}`)}>
              Edit
            </Button>
          );
        },
      },
    ];

    return (
      <div style={{ height: "100%", width: "100%" }}>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-delete-error"
          aria-describedby="modal-question-delete-error"
        >
          <Box
            sx={{
              position: "absolute" as "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              border: "2px solid #000",
              boxShadow: 24,
              p: 4,
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Typography
                variant="button"
                id="modal-modal-title"
                variant="h6"
                component="h2"
              >
                Error deleting question
              </Typography>
              <CancelOutlinedIcon color="error" />
            </Stack>
            <Typography
              id="modal-modal-description"
              variant="caption"
              sx={{ mt: 2 }}
            >
              This question belongs to a unit, and must first be removed from
              the unit before it can be deleted.
            </Typography>
          </Box>
        </Modal>
        <DataGrid
          sx={{
            border: 0,
          }}
          rows={props.questions}
          columns={columns}
          pageSize={10}
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

  const renderQuestions = () => {
    return dataGrid();
  };

  return renderQuestions();
};

const mapStateToProps = (state: RootState) => {
  return { questions: selectors.questions(state) };
};

export default connect(mapStateToProps, {
  fetch_questions,
  delete_questions,
})(QuestionFeed);
