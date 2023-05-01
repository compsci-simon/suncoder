import React from "react";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import CircleIcon from "@mui/icons-material/Circle";

type IconProps = {
  className?: string;
  fontSize?: "small" | "medium" | "large";
  color?: string;
};
const Check = () => {
  return (
    <CheckCircleOutlineRoundedIcon
      className="mr-2"
      fontSize="small"
      sx={{ color: "green" }}
    />
  );
};

const Cross = () => {
  return (
    <HighlightOffRoundedIcon
      className="mr-2"
      fontSize="small"
      sx={{ color: "red" }}
    />
  );
};

export { Check, Cross };
