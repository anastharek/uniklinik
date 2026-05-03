import Chart from "react-apexcharts";
const AreaChart = ({ series, category, name,color }) => {
  const state = {
    series: [
      {
        name: name,
        data: series,
        color: name === "users" ? "rgb(0, 143, 251)" : color,
      },
    ],
    options: {
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
      },
      xaxis: {
        type: "datetime",
        categories: category,
      },
      tooltip: {
        x: {
          format: "dd/MM/yy HH:mm",
        },
      },
      markers: {
        size: 5,
        hover: {
          size: 9
        }
      },
    },
  };

  return (
    <Chart
      options={state.options}
      series={state.series}
      type="area"
      height={350}
    />
  );
};

export default AreaChart;
