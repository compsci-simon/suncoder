import {
  Stack,
  FormLabel,
  FormControl,
  TextField,
  Button,
  Chip,
} from "@mui/material";
import Fuse from "fuse.js";
import React, { useEffect, useState } from "react";
import store from "../../store";
import { create_object } from "../../action";

type FragmentManagerProps = {
  fragments: {
    name: string;
  }[];
  fragment_name: string;
  tablename: string;
  deleteFragment: (fragment: { name: string }) => void;
};

const FragmentManager = ({
  fragments,
  fragment_name,
  tablename,
  deleteFragment,
}: FragmentManagerProps) => {
  const [fragName, setFragName] = useState("");
  const [refineTerm, setRefineTerm] = useState("");
  const [fragmentsToShow, setFragmentsToShow] = useState(fragments);

  useEffect(() => {
    setFragmentsToShow(fragments);
  }, [fragments]);

  const refineTermChanged = (new_term: string) => {
    setRefineTerm(new_term);
    if (new_term == "") {
      setFragmentsToShow(fragments);
      return;
    } else {
      const options = {
        keys: ["name"],
      };
      const fuse = new Fuse(fragments, options);
      const results = fuse.search(new_term);
      setFragmentsToShow(results.map((item) => item.item));
    }
  };

  const render_chips = () => {
    if (!Array.isArray(fragments)) {
      return <Chip label={`No items`} />;
    }
    return fragmentsToShow.map((frag, index) => {
      return (
        <Chip
          key={index}
          label={frag.name}
          onDelete={() => deleteFragment(frag)}
          className="mr-2 mb-2"
        />
      );
    });
  };

  return (
    <div className="p-3">
      <Stack direction="column" spacing={2}>
        <Stack
          direction="column"
          spacing={2}
          justifyContent="center"
          alignContent="center"
        >
          <FormLabel>Create {fragment_name}</FormLabel>
          <FormControl>
            <TextField
              label={`${fragment_name} name`}
              value={fragName}
              onChange={(e) => setFragName(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  store.dispatch<any>(
                    create_object(tablename, [{ name: fragName }])
                  );
                  setFragName("");
                }
              }}
            />
          </FormControl>
          <Button
            style={{ width: "200px" }}
            variant="outlined"
            onClick={() => {
              store.dispatch<any>(
                create_object(tablename, [{ name: fragName }])
              );
              setFragName("");
            }}
          >
            Create {fragment_name}
          </Button>
        </Stack>

        <FormLabel>Delete {fragment_name}</FormLabel>
        <Stack spacing={2}>
          <FormControl>
            <TextField
              label="Refine chips"
              value={refineTerm}
              onChange={(e) => refineTermChanged(e.target.value)}
            />
          </FormControl>
          <div
            className="border rounded p-3"
            style={{
              minHeight: "300px",
              overflowY: "auto",
            }}
          >
            {render_chips()}
          </div>
        </Stack>
      </Stack>
    </div>
  );
};

export default FragmentManager;
