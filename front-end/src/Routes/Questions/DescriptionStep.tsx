import Editor from "@monaco-editor/react";
import { Stack } from "@mui/material";
import { TextField } from "mui-rff";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";

const DescriptionStep = (props: any) => {
  const formProps = props.formProps;
  if (!formProps) return null;
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <TextField name="name" label="Question name" autoComplete="off" />
      <Stack direction="row" spacing={2} sx={{ position: "relative" }}>
        <div style={{ position: "absolute", width: "50%" }}>
          <Editor
            className="border"
            height="50vh"
            width="100%"
            defaultLanguage="markdown"
            theme="light"
            options={{
              fontSize: 16,
              lineNumbers: "off",
              folding: false,
            }}
            value={formProps.values["description"]}
            onChange={formProps.form.mutators.setDescription}
          />
        </div>
        <Stack
          sx={{
            border: 1,
            padding: 2,
            position: "absolute",
            left: "50%",
            width: "50%",
          }}
        >
          <ReactMarkdown
            children={formProps.values["description"]}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            skipHtml={false}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default DescriptionStep;
