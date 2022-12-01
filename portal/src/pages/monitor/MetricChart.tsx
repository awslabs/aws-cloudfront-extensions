import React, { useState, useEffect } from "react";
import { AmplifyConfigType } from "assets/js/type";
import Chart from "react-apexcharts";
import { useSelector } from "react-redux";
import { AppStateProps } from "reducer/appReducer";
import LoadingText from "components/LoadingText";

interface MetricChartProps {
  doRefresh: number;
  title: string;
  startDate: string;
  endDate: string;
  metricType: string;
  selectDomain: string;
}

const MetricChart: React.FC<MetricChartProps> = (props: MetricChartProps) => {
  const { doRefresh, title, startDate, endDate, metricType, selectDomain } =
    props;
  // const { t } = useTranslation();
  const amplifyConfig: AmplifyConfigType = useSelector(
    (state: AppStateProps) => state.amplifyConfig
  );
  // const [chartData, setChartData] = useState<any>();
  const [chartCategory, setChartCategory] = useState<any>([]);
  const [chartSeiresData, setChartSeiresData] = useState<any>([]);
  const [loadingData, setLoadingData] = useState(false);

  const getCdnStatusCode = (metricData: any) => {
    const status: number[] = [];
    metricData.map(function (element: any) {
      element.Value.map(function (obj: any) {
        if (!status.includes(obj.StatusCode)) {
          status.push(obj.StatusCode);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    status.map(function (code) {
      const data: any[] = [];
      metricData.map(function (element: any) {
        let found = false;
        element.Value.map(function (obj: any) {
          if (code === obj.StatusCode) {
            data.push(obj.Count);
            found = true;
          }
        });
        if (!found) {
          data.push(null);
        }
      });
      series.push({
        name: code + "",
        data: data,
      });
    });
    return series;
  };

  const getCdnStatusCodeOrigin = (metricData: any) => {
    const status: number[] = [];
    metricData.map(function (element: any) {
      element.Value.map(function (obj: any) {
        if (!status.includes(obj.StatusCode)) {
          status.push(obj.StatusCode);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    status.map(function (code) {
      const data: any[] = [];
      metricData.map(function (element: any) {
        let found = false;
        element.Value.map(function (obj: any) {
          if (code === obj.StatusCode) {
            data.push(obj.Count);
            found = true;
          }
        });
        if (!found) {
          data.push(null);
        }
      });
      series.push({
        name: code + "",
        data: data,
      });
    });
    return series;
  };

  const speedCategory: any[] = [];
  const getCdnDownloadSpeedData = (metricData: any) => {
    speedCategory.length = 0;
    const locations: string[] = [];
    const series: { name: string; data: any[] }[] = [];
    metricData.map(function (element: any) {
      Object.entries(element.Value).forEach((obj) => {
        if (obj[0] !== "domain" && obj[0] !== "timestamp") {
          Object.entries(obj[1] as object).forEach((speed) => {
            const name = obj[0] + "(" + speed[0] + ")";
            if (!locations.includes(name)) {
              locations.push(name);
            }
          });
        }
      });
    });
    locations.map(function (locationName) {
      const speeds: any[] = [];
      metricData.map(function (element: any) {
        Object.entries(element.Value).forEach((obj) => {
          if (obj[0] !== "domain" && obj[0] !== "timestamp") {
            Object.entries(obj[1] as object).forEach((speed) => {
              if (locationName === obj[0] + "(" + speed[0] + ")") {
                const sum: number =
                  speed[1]["250K"] * 250 +
                  speed[1]["750K"] * 750 +
                  speed[1]["500K"] * 500 +
                  speed[1]["250K"] * 250 +
                  speed[1]["1M"] * 1000 +
                  speed[1]["2M"] * 2000 +
                  speed[1]["3M"] * 3000 +
                  speed[1]["4M"] * 4000;
                speeds.push(sum);
                speedCategory.push(speed[1]);
              }
            });
          }
        });
      });
      series.push({
        name: locationName,
        data: speeds,
      });
    });
    return series;
  };

  const getCdnDownloadSpeedOriginData = (metricData: any) => {
    speedCategory.length = 0;
    const locations: string[] = [];
    const series: { name: string; data: any[] }[] = [];
    metricData.map(function (element: any) {
      Object.entries(element.Value).forEach((obj) => {
        if (obj[0] !== "domain" && obj[0] !== "timestamp") {
          Object.entries(obj[1] as object).forEach((speed) => {
            const name = obj[0] + "(" + speed[0] + ")";
            if (!locations.includes(name)) {
              locations.push(name);
            }
          });
        }
      });
    });
    locations.map(function (locationName) {
      const speeds: any[] = [];
      metricData.map(function (element: any) {
        Object.entries(element.Value).forEach((obj) => {
          if (obj[0] !== "domain" && obj[0] !== "timestamp") {
            Object.entries(obj[1] as object).forEach((speed) => {
              if (locationName === obj[0] + "(" + speed[0] + ")") {
                const sum: number =
                  speed[1]["250K"] * 250 +
                  speed[1]["750K"] * 750 +
                  speed[1]["500K"] * 500 +
                  speed[1]["250K"] * 250 +
                  speed[1]["1M"] * 1000 +
                  speed[1]["2M"] * 2000 +
                  speed[1]["3M"] * 3000 +
                  speed[1]["4M"] * 4000;
                speeds.push(sum);
                speedCategory.push(speed[1]);
              }
            });
          }
        });
      });
      series.push({
        name: locationName,
        data: speeds,
      });
    });
    return series;
  };

  const getCdnTopNUrlRequestsData = (metricData: any) => {
    const topurl: string[] = [];
    metricData.map(function (element: any) {
      element.Value.map(function (obj: any) {
        if (!topurl.includes(obj.Path)) {
          topurl.push(obj.Path);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    topurl.map(function (url) {
      const data: any[] = [];
      metricData.map(function (element: any) {
        let found = false;
        element.Value.map(function (obj: any) {
          if (url === obj.Path) {
            data.push(obj.Count);
            found = true;
          }
        });
        if (!found) {
          data.push(null);
        }
      });
      series.push({
        name: url,
        data: data,
      });
    });
    return series;
  };

  const getCdnTopNUrlSizeData = (metricData: any) => {
    const topurl: string[] = [];
    metricData.map(function (element: any) {
      element.Value.map(function (obj: any) {
        if (!topurl.includes(obj.Path)) {
          topurl.push(obj.Path);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    topurl.map(function (url) {
      const data: any[] = [];
      metricData.map(function (element: any) {
        let found = false;
        element.Value.map(function (obj: any) {
          if (url === obj.Path) {
            data.push(obj.Size);
            found = true;
          }
        });
        if (!found) {
          data.push(null);
        }
      });
      series.push({
        name: url,
        data: data,
      });
    });
    return series;
  };

  const getMetricsData = async () => {
    setLoadingData(true);
    const url2 = `${amplifyConfig.aws_monitoring_url}/metric?StartTime=${startDate}&EndTime=${endDate}&Metric=${metricType}&Domain=${selectDomain}`;
    try {
      const response = await fetch(url2, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": amplifyConfig.aws_monitoring_api_key,
        },
      });

      const data = await response.json();
      const resData = data?.Response?.Data?.[0]?.CdnData?.[0];
      console.info("resData:", resData);
      const dataMetrics: any = resData?.DetailData || [];
      if (
        resData?.Metric === "request" ||
        resData?.Metric === "requestOrigin" ||
        resData?.Metric === "chr" ||
        resData?.Metric === "chrBandWidth" ||
        resData?.Metric === "bandwidth" ||
        resData?.Metric === "bandwidthOrigin" ||
        resData?.Metric === "latencyratio" ||
        resData?.Metric === "downstreamTraffic"
      ) {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData([
          {
            name: "Value",
            data: dataMetrics.map((element: any) => element.Value),
          },
        ]);
      }

      if (resData?.Metric === "statusCode") {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData(getCdnStatusCode(dataMetrics));
      }

      if (resData?.Metric === "statusCodeOrigin") {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData(getCdnStatusCodeOrigin(dataMetrics));
      }

      if (resData?.Metric === "downloadSpeed") {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData(getCdnDownloadSpeedData(dataMetrics));
      }

      if (resData?.Metric === "downloadSpeedOrigin") {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData(getCdnDownloadSpeedOriginData(dataMetrics));
      }

      if (resData?.Metric === "topNUrlRequests") {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData(getCdnTopNUrlRequestsData(dataMetrics));
      }

      if (resData?.Metric === "topNUrlSize") {
        setChartCategory(dataMetrics.map((element: any) => element.Time));
        setChartSeiresData(getCdnTopNUrlSizeData(dataMetrics));
      }

      setLoadingData(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (startDate && endDate && selectDomain && metricType) {
      getMetricsData();
    }
  }, [doRefresh, startDate, endDate, selectDomain, metricType]);

  return (
    <div className="chart-item">
      <>
        {loadingData && (
          <div className="loading-data">
            <LoadingText />
          </div>
        )}
        <Chart
          options={{
            xaxis: {
              categories: chartCategory,
              labels: {
                show: false,
              },
            },
            title: {
              text: title,
            },
            chart: {
              height: 250,
              type: "line",
              zoom: {
                enabled: false,
              },
              animations: {
                enabled: false,
              },
              toolbar: {
                show: false,
                tools: {
                  download: false,
                },
              },
            },
            // tooltip: {
            //   custom: function ({ dataPointIndex }) {
            //     return (
            //       "<table>" +
            //       "<tr><td>4M</td><td>" +
            //       speedCategory[dataPointIndex]["4M"] +
            //       "</td></tr>" +
            //       "<tr><td>3M</td><td>" +
            //       speedCategory[dataPointIndex]["3M"] +
            //       "</td></tr>" +
            //       "<tr><td>2M</td><td>" +
            //       speedCategory[dataPointIndex]["2M"] +
            //       "</td></tr>" +
            //       "<tr><td>1M</td><td>" +
            //       speedCategory[dataPointIndex]["1M"] +
            //       "</td></tr>" +
            //       "<tr><td>750K</td><td>" +
            //       speedCategory[dataPointIndex]["750K"] +
            //       "</td></tr>" +
            //       "<tr><td>500K</td><td>" +
            //       speedCategory[dataPointIndex]["500K"] +
            //       "</td></tr>" +
            //       "<tr><td>250K</td><td>" +
            //       speedCategory[dataPointIndex]["250K"] +
            //       "</td></tr>" +
            //       "<tr><td>Other</td><td>" +
            //       speedCategory[dataPointIndex]["Other"] +
            //       "</td></tr>" +
            //       "</table>"
            //     );
            //   },
            // },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              width: 2,
              curve: "smooth",
            },
          }}
          series={chartSeiresData}
          type="line"
          width="90%"
        />
      </>
    </div>
  );
};

export default MetricChart;
