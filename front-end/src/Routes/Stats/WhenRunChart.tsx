import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
      display: false,
    },
    title: {
      display: false,
    },
  },
  maintainAspectRatio: false,
};

const WhenRunChart = (props: any) => {
  if (!props.attempts_per_day) return null;
  let labels = props.attempts_per_day.map((item: any) => item.date);
  let data = {
    labels,
    datasets: [
      {
        data: props.attempts_per_day.map((item: any) => item.attempts),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 0.9)",
        borderWidth: 2,
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        margin: "auto",
        height: props.height,
      }}
    >
      <div style={{ position: "absolute", width: "100%", height: "100%" }}>
        <Bar options={options} data={data} />
      </div>
    </div>
  );
};

export default WhenRunChart;
