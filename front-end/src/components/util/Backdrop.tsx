import React from "react";
import { Backdrop as MUIBackdrop, CircularProgress } from "@mui/material";

type BackdropProps = {
  open: boolean;
};
const Backdrop = ({ open }: BackdropProps) => {
  return (
    <div>
      <MUIBackdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        <CircularProgress color="inherit" />
      </MUIBackdrop>
    </div>
  );
};

export default Backdrop;
