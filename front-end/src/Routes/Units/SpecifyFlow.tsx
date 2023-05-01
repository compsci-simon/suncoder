import React, { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
  addEdge,
  Node,
  Edge,
  EdgeTypes,
} from "react-flow-renderer";
import { CustomEdge } from "./CustomEdge";

const SpecifyFlow = (props: any) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const formProps = props.formProps;
  if (!formProps) return null;
  const pools = formProps.values.pools;
  if (!pools) return null;
  const mutators = formProps.form.mutators;
  const add_Edge = (source_id: string, target_id: string) => {
    let target_idx = pools.map((item: any) => item.id).indexOf(target_id);
    let target = { ...pools[target_idx] };
    target.prerequisites.push({ id: source_id });
    mutators.update("pools", target_idx, target);
  };
  const delete_edge = (source_id: string, target_id: string) => {
    let target_idx = pools.map((item: any) => item.id).indexOf(target_id);
    let target = { ...pools[target_idx] };
    target.prerequisites = target.prerequisites.filter(
      (prereq: any) => prereq.id != source_id
    );
    mutators.update("pools", target_idx, target);
  };
  const edgeTypes: any = {
    custom: CustomEdge,
  };

  const onConnect = useCallback((params, edges) => {
    setEdges([
      ...edges,
      {
        id: `e${params.source}-${params.target}`,
        source: `${params.source}`,
        target: `${params.target}`,
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

  useEffect(() => {
    if (formProps.errors.cycle) {
      console.log(edges);
      let newEdges = edges.map((edge: any) => {
        return { ...edge, style: { stroke: "red" } };
      });
      setEdges(newEdges);
      let newNodes = nodes.map((node: any) => {
        return { ...node, style: { border: "1px solid red" } };
      });
      setNodes(newNodes);
    } else {
      let newEdges = edges.map((edge: any) => {
        return { ...edge, style: {} };
      });
      setEdges(newEdges);
      let newNodes = nodes.map((node: any) => {
        return { ...node, style: {} };
      });
      setNodes(newNodes);
    }
  }, [formProps.errors]);

  useEffect(() => {
    let n: Node<{
      label: string;
    }>[] = [];
    let e: Edge[] = [];
    let sorted_pools = pools.sort((a: any, b: any) => a.poolnum - b.poolnum);
    for (let i = 0; i < sorted_pools.length; i++) {
      n.push({
        id: sorted_pools[i].id,
        data: { label: `Pool ${i + 1}` },
        position: { x: 20 * i, y: 80 * i },
      });
    }
    for (let target of sorted_pools) {
      for (let source of target.prerequisites) {
        e.push({
          id: `e${source.id}-${target.id}`,
          source: `${source.id}`,
          target: `${target.id}`,
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
          fitView
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params: any) => onConnect(params, edges)}
          onEdgesDelete={onEdgesDelete}
          edgeTypes={edgeTypes}
        >
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default SpecifyFlow;
