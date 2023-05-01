import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Checkbox,
  TableFooter,
  FormHelperText,
} from "@mui/material";
import { courseUnit } from "../Units/units";

type unitHierarchyProps = {
  units: {
    id: string;
    name: string;
    prerequisites: {
      id: string;
      name: string;
    }[];
  }[];
  error?: {
    [key: string]: any;
  };
  error_msg?: string;
  updateFields: (index: number, value: any) => void;
};

const UnitHierarchy = ({
  units,
  updateFields,
  error,
  error_msg,
}: unitHierarchyProps) => {
  const checkBox = (row: number, unit1: courseUnit, unit2: courseUnit) => {
    if (unit1.prerequisites.map((x: any) => x.id).includes(unit2.id)) {
      unit1.prerequisites = unit1.prerequisites.filter(
        (prereq: any) => prereq.id !== unit2.id
      );
    } else {
      unit1.prerequisites.push(unit2);
    }
    updateFields(row, unit1);
  };

  if (units === undefined) {
    return <small className="text-muted">No units selected</small>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Unit</TableCell>
            {units.map((unit, index) => {
              return <TableCell key={index}>{unit.name}</TableCell>;
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit1, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{unit1.name}</TableCell>
                {units.map((unit2, index2) => {
                  if (index !== index2) {
                    return (
                      <TableCell key={index2}>
                        <Checkbox
                          checked={
                            unit1.prerequisites
                              .map((item) => item.id)
                              .includes(unit2.id)
                              ? true
                              : false
                          }
                          onClick={() => checkBox(index, unit1, unit2)}
                        />
                      </TableCell>
                    );
                  } else {
                    return <TableCell key={index2} />;
                  }
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {error && (
        <FormHelperText error sx={{ marginLeft: "14px" }}>
          {error_msg}
        </FormHelperText>
      )}
    </TableContainer>
  );
};

export default UnitHierarchy;
