import React from 'react'
import { Box } from "@mui/material";
import { styled } from '@mui/material/styles';

const Tabpanel = (props) => {
  const { children, value, index, ...other } = props;
  if (value !== index) return null

  return (
    <div
      {...other}
    >
      {children}
    </div>
  );
}

const TabPanelWithSx = styled(Tabpanel)({})

export default TabPanelWithSx