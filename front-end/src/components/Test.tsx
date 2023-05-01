import * as React from "react";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

function Test() {
  const numRef = React.useRef(null);
  return (
    <div className="App">
      <CancelOutlinedIcon color="success" />
    </div>
  );
}

export default Test;
