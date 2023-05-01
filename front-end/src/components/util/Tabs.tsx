import { Box, Tab, Tabs as MuiTabs } from "@mui/material";
import React, { useState } from "react";
import Tabpanel from "./Tabpanel";

type tabsProps = {
  tabs: {
    name: string;
    content: React.ReactElement<any>;
  }[];
  selectorHeight?: number;
};
export const TabContext = React.createContext<any>(null);

const Tabs = ({ tabs, selectorHeight = 65 }: tabsProps) => {
  const [value, setValue] = useState(0);

  const handleChange = (_: any, newValue: number) => {
    setValue(newValue);
  };

  return (
    <TabContext.Provider value={{ setValue: setValue }}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <MuiTabs value={value} onChange={handleChange}>
            {tabs.map((tab, index) => {
              return (
                <Tab
                  key={index}
                  label={tab.name}
                  sx={{ height: `${selectorHeight}px` }}
                />
              );
            })}
          </MuiTabs>
        </Box>
        {tabs.map((tab, index) => {
          return (
            <Tabpanel
              key={index}
              value={value}
              index={index}
              sx={{ flexGrow: 2, position: "relative" }}
            >
              {tab.content}
            </Tabpanel>
          );
        })}
      </Box>
    </TabContext.Provider>
  );
};

export default Tabs;
