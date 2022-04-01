import React from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import HeaderPanel from "components/HeaderPanel";
import Chart from "react-apexcharts";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "CloudFront Monitoring",
    link: "",
  },
];

const buildRandomArr = (count: number) => {
  const tmpArr = [];
  const buildRandomData = (start: number, end: number) => {
    const num = Math.floor(Math.random() * (end - start) + start);
    return num;
  };
  for (let i = 0; i < count; i++) {
    const data = buildRandomData(10, 100);
    tmpArr.push(data);
  }
  return tmpArr;
};

const CharList = [
  { id: "", name: "Request" },
  { id: "", name: "RequestOrigin" },
  { id: "", name: "StatusCode" },
  { id: "", name: "StatusCodeOrigin" },
  { id: "", name: "Bandwidth" },
  { id: "", name: "BandwidthOrigin" },
  { id: "", name: "chrBandWith" },
  { id: "", name: "DownloadSpped" },
  { id: "", name: "DownloadSppedOrigin" },
];

const CloudFront: React.FC = () => {
  const chartOptions = {
    options: {
      stroke: {
        show: true,
        curve: "smooth",
      } as any,
      chart: {
        stacked: false,
        toolbar: {
          tools: {
            download: true,
            selection: true,
            zoom: false,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: false,
            customIcons: [],
          },
        },
        stroke: {
          // width: [0, 2, 5],
          curve: "smooth",
        },
        id: "apexchart-example",
      },
      labels: [
        "01/01",
        "02/01",
        "03/01",
        "04/01",
        "05/01",
        "06/01",
        "07/01",
        "08/01",
        "09/01",
      ],
      // xaxis: {
      //   categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
      // },
    },
    // series: [
    //   {
    //     name: "series-1",
    //     data: buildRandomArr(9),
    //   },
    // ],
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <HeaderPanel
        title="Monitoring"
        action={
          <div>
            <Button>Download</Button>
          </div>
        }
      >
        <div className="flex flex-warp">
          {CharList.map((element, index) => {
            return (
              <div key={index} className="chart-item">
                <Chart
                  options={{
                    ...chartOptions.options,
                    title: {
                      // ...chartOptions.options.,
                      text: element.name,
                    },
                  }}
                  series={[{ name: "count", data: buildRandomArr(9) }]}
                  type="line"
                  width={"100%"}
                  height={180}
                />
              </div>
            );
          })}
        </div>
      </HeaderPanel>
    </div>
  );
};

export default CloudFront;
