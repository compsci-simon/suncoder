import React, { useEffect, useState } from "react";
import { Box, Chip, FormHelperText, Stack, TextField } from "@mui/material";
import Fuse from "fuse.js";

import "./FilterChipBox.css";

export type item = {
  name: string;
  id: string;
};

type filterChipBoxProps = {
  allItems: any[];
  selectedItems: any[];
  selectItem: (value: any) => void;
  deselectItem: (index: number) => any;
  error?: any;
  error_msg?: string;
  id_key: string;
};

type shownItemsProps = {
  unselectedItems: any[];
  filterTerm: string;
  selectItem: (value: any) => void;
  id_key: string;
};

type selectedItemsProp = {
  selectedItems: item[];
  deselectItem: (index: number) => any;
  error?: any;
  id_key: string;
};

const shownItemsComponent = ({
  unselectedItems,
  filterTerm,
  selectItem,
  id_key,
}: shownItemsProps) => {
  if (filterTerm === "") {
    return (
      <Box className="input-box">
        {unselectedItems.map((item) => {
          return (
            <Chip
              key={item[id_key]}
              label={item.name}
              className="m-1"
              onClick={() => selectItem(item)}
            />
          );
        })}
      </Box>
    );
  }
  let fuse = new Fuse(unselectedItems, {
    keys: ["name"],
  });
  let results = fuse.search(filterTerm).map((item) => {
    return item.item;
  });
  return (
    <Box className="input-box">
      {results.map((item) => {
        return (
          <Chip
            key={item[id_key]}
            label={item.name}
            className="m-1"
            onClick={() => selectItem(item)}
          />
        );
      })}
    </Box>
  );
};

const selectedItemsComponent = ({
  selectedItems,
  deselectItem,
  error,
  id_key,
}: selectedItemsProp) => {
  if (!selectedItems || selectedItems.length == 0) {
    return (
      <Box className="input-box">
        <Chip label="No items selected" className="m-1" />
      </Box>
    );
  } else {
    let className = "input-box";
    if (error!) {
      className += " input-box-error";
    }
    return (
      <Box className={className}>
        {selectedItems.map((item, index) => {
          return (
            <Chip
              key={item[id_key]}
              label={item.name}
              className="m-1"
              color={
                error && error!["ids"].includes(item.id) ? "error" : "default"
              }
              onClick={() => deselectItem(index)}
            />
          );
        })}
      </Box>
    );
  }
};

const FilterChipBox = ({
  allItems,
  selectedItems,
  selectItem,
  deselectItem,
  error,
  error_msg,
  id_key,
}: filterChipBoxProps) => {
  const [filterTerm, setFilterTerm] = useState("");
  const [unselectedItems, setUnselectedItems] = useState<item[]>([]);

  useEffect(() => {
    if (allItems && selectedItems) {
      let u: item[] = [];
      for (let i = 0; i < allItems.length; i++) {
        let add = true;
        for (let j = 0; j < selectedItems.length; j++) {
          if (allItems[i][id_key] === selectedItems[j][id_key]) {
            add = false;
            break;
          }
        }
        if (add) {
          u.push(allItems[i]);
        }
      }
      setUnselectedItems(u);
    }
  }, [allItems, selectedItems]);

  return (
    <Stack spacing={2}>
      <TextField
        label="Filter"
        value={filterTerm}
        onChange={(e) => setFilterTerm(e.target.value)}
        autoComplete="off"
      />
      {shownItemsComponent({ unselectedItems, filterTerm, selectItem, id_key })}
      <div>
        {selectedItemsComponent({ selectedItems, deselectItem, error, id_key })}
        {error && (
          <FormHelperText error sx={{ marginLeft: "14px" }}>
            {error_msg}
          </FormHelperText>
        )}
      </div>
    </Stack>
  );
};

export default FilterChipBox;
