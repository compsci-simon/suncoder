import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  useEdgesState,
  useNodesState,
  Background,
  MarkerType,
} from "react-flow-renderer";
import { CustomEdge } from "./CustomEdge";

const FlowStep = (props: any) => {
  const fields = props.fields;
  const meta = props.meta;
  const units: any[] = props.fields.value;
  if (!units) return null;
  const add_Edge = (source_id: string, target_id: string) => {
    let target_idx = fields.value
      .map((item: any) => item.id)
      .indexOf(target_id);
    let target = { ...fields.value[target_idx] };
    target.prerequisites.push({ id: source_id });
    fields.update(target_idx, target);
  };
  const delete_edge = (source_id: string, target_id: string) => {
    let target_idx = fields.value
      .map((item: any) => item.id)
      .indexOf(target_id);
    let target = { ...fields.value[target_idx] };
    target.prerequisites = target.prerequisites.filter(
      (prereq: any) => prereq.id != source_id
    );
    fields.update(target_idx, target);
  };
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params, edges) => {
    setEdges([
      ...edges,
      {
        id: `e${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: "custom",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
    ]);
    let source_id = params.source;
    let target_id = params.target;
    add_Edge(source_id, target_id);
  }, []);
  const onEdgesDelete = useCallback((params) => {
    for (let edge of params) {
      delete_edge(edge.source, edge.target);
    }
  }, []);
  const edgeTypes: any = {
    custom: CustomEdge,
  };

  useEffect(() => {
    if (meta.error) {
      setEdges(
        edges.map((edge: any) => {
          return { ...edge, style: { stroke: "red" } };
        })
      );
      setNodes(
        nodes.map((node: any) => {
          return { ...node, style: { border: "1px solid red" } };
        })
      );
    } else {
      setEdges(
        edges.map((edge: any) => {
          return { ...edge, style: {} };
        })
      );
      setNodes(
        nodes.map((node: any) => {
          return { ...node, style: {} };
        })
      );
    }
  }, [meta.error]);

  useEffect(() => {
    let n: any[] = [];
    let e: any[] = [];
    let unit_ids = units.map((u) => u.id);
    for (let index = 0; index < units.length; index++) {
      let unit = units[index];
      n.push({
        id: unit.id,
        data: { label: unit.name },
        position: { x: 20 * index, y: 80 * index },
      });
      let prerequisites = unit.prerequisites.filter((p: any) => {
        return unit_ids.includes(p.id);
      });
      fields.update(index, { ...unit, prerequisites });
      for (let prereq of prerequisites) {
        e.push({
          id: `e${prereq.id}-${unit.id}`,
          source: prereq.id,
          target: unit.id,
          type: "custom",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    }
    setNodes(n);
    setEdges(e);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        border: "1px solid black",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "105%",
          position: "absolute",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params: any) => onConnect(params, edges)}
          onEdgesDelete={onEdgesDelete}
          fitView
          edgeTypes={edgeTypes}
        >
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowStep;
