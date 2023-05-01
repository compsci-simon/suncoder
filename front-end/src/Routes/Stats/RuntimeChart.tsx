import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { bin_code_runtimes } from "../../helper";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  maintainAspectRatio: false,
};

const RuntimeChart = (props: any) => {
  if (!props.runtimes) return null;
  const [bins, setBins] = useState<{ label: string; value: number }[]>([]);
  const labels = bins.map((item) => item.label);
  const datasets = [
    {
      data: bins.map((item) => item.value),
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      tension: 0.1,
    },
  ];
  const data = {
    labels,
    datasets,
  };

  useEffect(() => {
    setBins(bin_code_runtimes(props.runtimes, 10));
  }, [props.runtimes]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: props.height,
        margin: "auto",
      }}
    >
      <div style={{ position: "absolute", width: "100%", height: "100%" }}>
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default RuntimeChart;
