import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import LoadingText from "components/LoadingText";
import { AmplifyConfigType } from "assets/js/type";
import { useSelector } from "react-redux";
import { AppStateProps } from "reducer/appReducer";
import { MetricType } from "../CloudFrontMetrics";
import { MonitorTable } from "./MonitorTable";
import HeaderPanel from "components/HeaderPanel";
import Axios from "axios";

interface MonitorChartsProps {
  isTable?: boolean;
  curCountry?: string;
  domainName: string;
  graphTitle: string;
  yAxisUnit: string;
  metricType: string;
  startTime: string;
  endTime: string;
  isRefresh: number;
}

const MonitorCharts: React.FC<MonitorChartsProps> = (
  props: MonitorChartsProps
) => {
  const {
    isTable,
    curCountry,
    domainName,
    graphTitle,
    yAxisUnit,
    startTime,
    endTime,
    metricType,
    isRefresh,
  } = props;
  const amplifyConfig: AmplifyConfigType = useSelector(
    (state: AppStateProps) => state.amplifyConfig
  );
  const chartDefaultOptions: ApexOptions = {
    chart: {
      redrawOnParentResize: true,
      id: domainName,
      width: "100%",
      // height: 200,
      type: "line",
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: false,
      },
    },
    colors: ["#0073bb", "#ec7211", "#2ca02c", "#d62728"],
    grid: {
      padding: {
        top: 20,
        right: 10,
        bottom: 0,
        left: 20,
      },
    },
    legend: {
      show: true,
      showForSingleSeries: true,
      position: "bottom",
      horizontalAlign: "left",
      offsetX: 30,
      offsetY: 10,
    },
    yaxis: {
      tickAmount: 2,
      title: {
        text: yAxisUnit,
        rotate: -90,
        offsetX: 7,
        // offsetY: -140,
        style: {
          fontWeight: "500",
          color: "#666",
        },
      },
      forceNiceScale: false,
      min: 0,
      labels: {
        show: true,
        align: "right",
      },
      axisBorder: {
        show: false,
        color: "#78909C",
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: {
        show: false,
        color: "#78909C",
        width: 6,
        offsetX: 0,
        offsetY: 0,
      },
      crosshairs: {
        show: true,
        position: "back",
        stroke: {
          color: "#b6b6b6",
          width: 1,
          dashArray: 0,
        },
      },
      tooltip: {
        enabled: true,
        offsetX: -5,
      },
    },

    noData: {
      text: `No data available. 
      Try adjusting the dashboard time range.`,
      align: "center",
      verticalAlign: "middle",
      style: {
        color: "#888",
        fontSize: "14px",
        fontFamily: undefined,
      },
    },
    stroke: {
      curve: "straight",
      width: 2,
    },
    tooltip: {
      x: {
        format: "yyyy-MM-dd HH:mm",
      },
      y: {
        formatter(value: any) {
          return value ? value.toLocaleString("en-US") : value;
        },
      },
    },
    xaxis: {
      type: "datetime",
      tickAmount: 10,
      categories: [
        new Date(startTime).getTime() * 1000,
        new Date(endTime).getTime() * 1000,
      ],
      labels: {
        datetimeFormatter: {
          year: "yyyy",
          month: "yyyy-MM",
          day: "MM/dd",
          hour: "HH:mm",
          minute: "HH:mm",
        },
      },
    },
  };
  const [loadingData, setLoadingData] = useState(false);
  const [options, setOptions] = useState<ApexOptions>(chartDefaultOptions);
  const [series, setSeries] = useState<any[]>([]);
  const [tableDataList, settableDataList] = useState([]);
  const [tableKeyName, setTableKeyName] = useState("");
  const [tableValueName, setTableValueName] = useState("");
  const [dataKey, setDataKey] = useState("");
  const [dataValue, setDataValue] = useState("");

  const buildMultiLineData = (
    seriesData: any[],
    keyName: string,
    valueName: string
  ) => {
    const tmpSeriesKeys: any[] = [];
    seriesData.forEach((element: any) => {
      element.map((obj: any) => {
        if (!tmpSeriesKeys.includes(obj[keyName])) {
          tmpSeriesKeys.push(obj[keyName]);
        }
      });
    });
    const tmpSeries: { name: string; data: any[] }[] = [];
    tmpSeriesKeys.map(function (key) {
      const data: any[] = [];
      seriesData.forEach((element: any) => {
        let found = false;
        element.map((obj: any) => {
          if (key === obj[keyName]) {
            data.push(obj[valueName]);
            found = true;
          }
        });
        if (!found) {
          data.push(null);
        }
      });
      tmpSeries.push({
        name: key + "",
        data: data,
      });
    });
    return tmpSeries;
  };

  const buildMetricData = (data: any) => {
    const tmpCategories = data.DetailData.map((item: any) => item.Time);
    const tmpSeriesData = data.DetailData.map((item: any) => item.Value);

    if (tmpCategories.length > 0) {
      let tmpSeries = [
        {
          name: data.Metric,
          data: tmpSeriesData,
        },
      ];

      if (
        metricType === MetricType.chr ||
        metricType === MetricType.chrBandWidth
      ) {
        tmpSeries = [
          {
            name: data.Metric,
            data: tmpSeriesData.map((element: any) => {
              return parseFloat(element);
            }),
          },
        ];
      }

      // statusCode or statusCodeOrigin
      if (
        metricType === MetricType.statusCode ||
        metricType === MetricType.statusCodeOrigin
      ) {
        tmpSeries = buildMultiLineData(tmpSeriesData, "StatusCode", "Count");
      }

      // statusCodeLatency or statusCodeOriginLatency
      if (
        metricType === MetricType.statusCodeLatency ||
        metricType === MetricType.statusCodeOriginLatency
      ) {
        tmpSeries = buildMultiLineData(tmpSeriesData, "StatusCode", "Latency");
      }

      // x-edge-response-result-type-count
      if (metricType === MetricType.edgeType) {
        tmpSeries = buildMultiLineData(tmpSeriesData, "EdgeType", "Count");
      }

      //x-edge-response-result-type average latency
      if (metricType === MetricType.edgeTypeLatency) {
        tmpSeries = buildMultiLineData(tmpSeriesData, "EdgeType", "Latency");
      }

      setOptions({
        ...chartDefaultOptions,
        xaxis: {
          ...chartDefaultOptions.xaxis,
          categories: tmpCategories,
        },
      });
      setSeries(tmpSeries);
    } else {
      setOptions({
        ...chartDefaultOptions,
        xaxis: {
          ...chartDefaultOptions.xaxis,
          categories: [
            new Date(startTime).getTime(),
            new Date(endTime).getTime(),
          ],
        },
      });
      setSeries([]);
    }

    // Top N request URL
    if (metricType === MetricType.topNUrlRequests) {
      setDataKey("Path");
      setDataValue("Count");
      setTableKeyName("URL");
      setTableValueName("Requests");
      settableDataList(tmpSeriesData?.[0] || []);
    }

    // Top N URL with traffic
    if (metricType === MetricType.topNUrlSize) {
      setDataKey("Path");
      setDataValue("Size");
      setTableKeyName("URL");
      setTableValueName("Bytes");
      settableDataList(tmpSeriesData?.[0] || []);
    }
  };
  // const tmpStartTime = "2022-12-22 07:35:00";
  // const tmpEndTime = "2022-12-22 07:40:00";
  // const tmpStartTime = "2022-12-20 20:00:00";
  // const tmpEndTime = "2022-12-21 09:00:00";
  const getMetricsData = async () => {
    setLoadingData(true);
    const url2 = `${
      amplifyConfig.aws_monitoring_url
    }/metric?StartTime=${startTime}&EndTime=${endTime}&Metric=${metricType}&Domain=${domainName}${
      curCountry !== "All" ? "&Country=" + curCountry : ""
    }`;
    try {
      const response = await Axios.get(url2, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": amplifyConfig.aws_monitoring_api_key,
        },
      });

      if (response.data) {
        const resData = response?.data?.Response?.Data?.[0]?.CdnData?.[0];
        buildMetricData(resData);
      }
      setLoadingData(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (startTime && endTime && domainName && metricType) {
      getMetricsData();
    }
  }, [startTime, endTime, domainName, metricType]);

  useEffect(() => {
    console.info("startTime|endTime:", startTime, endTime);
    if (domainName && startTime && endTime) {
      getMetricsData();
    }
  }, [domainName, startTime, endTime, curCountry, isRefresh]);

  return (
    <div className="monitor-chart">
      <HeaderPanel title={graphTitle} contentNoPadding>
        <div className="pr">
          {loadingData && (
            <div className="chart-mask">
              <LoadingText />
            </div>
          )}
          {isTable ? (
            <MonitorTable
              keyName={tableKeyName}
              valueName={tableValueName}
              dataKey={dataKey}
              dataValue={dataValue}
              list={tableDataList}
            />
          ) : (
            <Chart options={options} height={260} series={series} />
          )}
        </div>
      </HeaderPanel>
    </div>
  );
};

export default MonitorCharts;
