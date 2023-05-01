import React from "react";
import { getBezierPath } from "react-flow-renderer";
import "../style.css";

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        className="react-flow__edge-path-selector"
        d={edgePath}
        fillRule="evenodd"
      />
      <path
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fillRule="evenodd"
      />
    </>
  );
};
