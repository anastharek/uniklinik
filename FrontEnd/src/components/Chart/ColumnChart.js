import Chart from "react-apexcharts";

const ColumnChart = ({ series=[], category }) => {
  const state = {
    series: series,
    options: {
      chart: {
        toolbar: {
          show: false
        },
      },
    plotOptions: {
      bar: {
        horizontal: false,
        endingShape: "rounded",
      },
    },
    xaxis: {
      categories:category||[
        "Feb",
        "Mar",
        "Apr",
        "Apr",
      ],
    }
   }
  };

  return (
    <Chart
      options={state.options}
      series={state.series}
      type="bar"
      height={350}
    />
  );
};

export default ColumnChart;
