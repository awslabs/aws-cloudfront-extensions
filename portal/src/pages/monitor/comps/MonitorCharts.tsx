import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import LoadingText from "components/LoadingText";
import {
  AmplifyConfigType,
  LegendMetricNameMap,
  MetricType,
} from "assets/js/type";
import { useSelector } from "react-redux";
import { AppStateProps } from "reducer/appReducer";
import { MonitorTable } from "./MonitorTable";
import HeaderPanel from "components/HeaderPanel";
import ZoomOutMapIcon from "@material-ui/icons/ZoomOutMap";
import Axios from "axios";
import Modal from "components/Modal";
import Button from "components/Button";
import { useTranslation } from "react-i18next";
import TimeRange from "./TimeRange";
import { MONITOR_HELP_LINK } from "assets/js/const";
import { nFormatter } from "assets/js/utils";

interface MonitorChartsProps {
  isTable?: boolean;
  curCountry?: string;
  rangeType: string;
  domainName: string;
  graphTitle: string;
  yAxisUnit: string;
  metricType: string;
  startTime: string;
  endTime: string;
  isRefresh: number;
}

const HAS_INFO_LINK_CHART: string[] = [
  MetricType.statusCode,
  MetricType.statusCodeOrigin,
  MetricType.statusCodeLatency,
  MetricType.statusCodeOriginLatency,
  MetricType.latencyRatio,
  MetricType.bandwidth,
  MetricType.bandwidthOrigin,
  MetricType.downstreamTraffic,
  MetricType.chr,
  MetricType.chrBandWidth,
  MetricType.edgeType,
  MetricType.edgeTypeLatency,
];

const MonitorCharts: React.FC<MonitorChartsProps> = (
  props: MonitorChartsProps
) => {
  const {
    isTable,
    curCountry,
    rangeType,
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
  const { t } = useTranslation();
  const chartDefaultOptions: ApexOptions = {
    chart: {
      redrawOnParentResize: true,
      id: domainName + Math.random() * 100,
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
      offsetY: 5,
    },
    yaxis: {
      tickAmount: 5,
      forceNiceScale: false,
      // min: 0,
      labels: {
        show: true,
        align: "right",
        formatter: (value) => {
          return nFormatter(value, 2);
        },
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
        new Date(decodeURI(startTime)).getTime(),
        new Date(decodeURI(endTime)).getTime(),
      ],
      labels: {
        datetimeUTC: false,
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
  const [openModal, setOpenModal] = useState(false);
  const [chartModalStartTime, setChartModalStartTime] = useState(startTime);
  const [chartModalEndTime, setChartModalEndTime] = useState(endTime);
  const [chartModalRangeType, setchartModalRangeType] = useState(rangeType);
  const [chartModalOptions, setchartModalOptions] =
    useState(chartDefaultOptions);
  const [chartModalSeries, setChartModalSeries] = useState<any[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  const buildMultiLineData = (
    seriesData: any[],
    keyName: string,
    valueName: string,
    isStatusCode = false
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
      if (isStatusCode) {
        if (!key.toString().startsWith("2")) {
          tmpSeries.push({
            name: key + "",
            data: [null, ...data, null],
          });
        }
      } else {
        tmpSeries.push({
          name: key + "",
          data: [null, ...data, null],
        });
      }
    });
    return tmpSeries;
  };

  const buildLatencyRatioMultiLineData = (seriesData: any[]) => {
    const tmpSeriesData = [
      {
        name: "300-600ms rate",
        data: seriesData.map((item: any) => item.Value_300),
      },
      {
        name: "600-1000ms rate",
        data: seriesData.map((item: any) => item.Value_600),
      },
      {
        name: "1000ms+ rate",
        data: seriesData.map((item: any) => item.Value),
      },
    ];
    return tmpSeriesData;
  };

  const buildStatusCodeChartData = (
    seriesData: any[],
    keyName: string,
    valueName: string
  ) => {
    const tmpSeriesKeys: any[] = [];
    const valueSeriesData = seriesData.map((item: any) => item.Value);
    valueSeriesData.forEach((element: any) => {
      element.map((obj: any) => {
        if (!tmpSeriesKeys.includes(obj[keyName])) {
          tmpSeriesKeys.push(obj[keyName]);
        }
      });
    });
    const tmpSeries: { name: string; data: any[] }[] = [];
    tmpSeriesKeys.map(function (key) {
      const data: any[] = [];
      valueSeriesData.forEach((element: any, index: number) => {
        let found = false;
        element.map((obj: any) => {
          if (key === obj[keyName]) {
            data.push(
              (parseInt(obj[valueName]) /
                parseInt(seriesData?.[index]?.["Sum"])) *
                100
            );
            found = true;
          }
        });
        if (!found) {
          data.push(null);
        }
      });
      if (!key.toString().startsWith("2")) {
        tmpSeries.push({
          name: key + "",
          data: [null, ...data, null],
        });
      }
    });
    return tmpSeries;
  };

  const buildMetricData = (data: any, isModal = false) => {
    const originCategories = data.DetailData.map((item: any) => item.Time);
    const tmpSeriesData = data.DetailData.map((item: any) => item.Value);

    const setChartWithData = (categories: any, series: any) => {
      if (isModal) {
        // Set Modal Data
        setchartModalOptions({
          ...chartDefaultOptions,
          xaxis: {
            ...chartDefaultOptions.xaxis,
            categories: categories,
          },
        });
        setChartModalSeries(series);
      } else {
        setOptions({
          ...chartDefaultOptions,
          xaxis: {
            ...chartDefaultOptions.xaxis,
            categories: categories,
          },
        });
        setSeries(series);
      }
    };

    const setChartWithoutData = () => {
      if (isModal) {
        // Set Modal Data
        setChartModalSeries([]);
        setchartModalOptions({
          ...chartDefaultOptions,
          legend: {
            ...chartDefaultOptions.legend,
            show: false,
          },
          xaxis: {
            ...chartDefaultOptions.xaxis,
            categories: [
              new Date(chartModalStartTime).getTime(),
              new Date(chartModalEndTime).getTime(),
            ],
          },
        });
      } else {
        setOptions({
          ...chartDefaultOptions,
          legend: {
            ...chartDefaultOptions.legend,
            show: false,
          },
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
    };

    if (originCategories.length > 0) {
      let tmpCategories = [];
      if (isModal) {
        tmpCategories = [
          chartModalStartTime,
          ...originCategories,
          chartModalEndTime,
        ];
      } else {
        tmpCategories = [startTime, ...originCategories, endTime];
      }

      let tmpSeries = [
        {
          name: LegendMetricNameMap[data.Metric],
          data: [null, ...tmpSeriesData, null],
        },
      ];

      if (
        metricType === MetricType.chr ||
        metricType === MetricType.chrBandWidth
      ) {
        tmpSeries = [
          {
            name: LegendMetricNameMap[data.Metric],
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
        const statusCodeSeriesData = data.DetailData;
        statusCodeSeriesData.forEach((element: any) => {
          element.Sum = element.Value.reduce(
            (accumulator: number, item: any) => {
              return accumulator + parseInt(item.Count);
            },
            0
          );
        });
        tmpSeries = buildStatusCodeChartData(
          statusCodeSeriesData,
          "StatusCode",
          "Count"
        );
      }

      // statusCodeLatency or statusCodeOriginLatency
      if (
        metricType === MetricType.statusCodeLatency ||
        metricType === MetricType.statusCodeOriginLatency
      ) {
        tmpSeries = buildMultiLineData(
          tmpSeriesData,
          "StatusCode",
          "Latency",
          true
        );
      }

      // x-edge-response-result-type-count
      if (metricType === MetricType.edgeType) {
        tmpSeries = buildMultiLineData(tmpSeriesData, "EdgeType", "Count");
      }

      //x-edge-response-result-type average latency
      if (metricType === MetricType.edgeTypeLatency) {
        tmpSeries = buildMultiLineData(tmpSeriesData, "EdgeType", "Latency");
      }
      if (metricType === MetricType.latencyRatio) {
        tmpSeries = buildLatencyRatioMultiLineData(data.DetailData);
      }

      if (tmpSeries && tmpSeries.length > 0) {
        setChartWithData(tmpCategories, tmpSeries);
      } else {
        setChartWithoutData();
      }
    } else {
      setChartWithoutData();
    }

    // Top N request URL
    if (metricType === MetricType.topNUrlRequests) {
      setDataKey("Path");
      setDataValue("Count");
      setTableKeyName("URLs");
      setTableValueName("Requests");
      settableDataList(tmpSeriesData?.[0] || []);
    }

    // Top N URL with traffic
    if (metricType === MetricType.topNUrlSize) {
      setDataKey("Path");
      setDataValue("Size");
      setTableKeyName("URLs");
      setTableValueName("Bytes");
      settableDataList(tmpSeriesData?.[0] || []);
    }
  };

  const getMetricsData = async (
    isModal?: boolean,
    modalStartTime?: string,
    modalEndTime?: string
  ) => {
    let requestUrl = ``;
    if (isModal) {
      setLoadingModalData(true);
      requestUrl = `${
        amplifyConfig.aws_monitoring_url
      }/metric?StartTime=${modalStartTime}&EndTime=${modalEndTime}&Metric=${metricType}&Domain=${domainName}${
        curCountry !== "All" ? "&Country=" + curCountry : ""
      }`;
    } else {
      setLoadingData(true);
      requestUrl = `${
        amplifyConfig.aws_monitoring_url
      }/metric?StartTime=${startTime}&EndTime=${endTime}&Metric=${metricType}&Domain=${domainName}${
        curCountry !== "All" ? "&Country=" + curCountry : ""
      }`;
    }
    try {
      const response = await Axios.get(requestUrl, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": amplifyConfig.aws_monitoring_api_key,
        },
      });

      if (response.data) {
        const resData = response?.data?.Response?.Data?.[0]?.CdnData?.[0];
        if (isModal) {
          buildMetricData(resData, true);
        } else {
          buildMetricData(resData);
        }
      }
      setLoadingData(false);
      setLoadingModalData(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (domainName && startTime && endTime && metricType) {
      getMetricsData();
    }
  }, [domainName, metricType, startTime, endTime, curCountry, isRefresh]);

  useEffect(() => {
    if (domainName && chartModalStartTime && chartModalEndTime) {
      getMetricsData(true, chartModalStartTime, chartModalEndTime);
    }
  }, [chartModalStartTime, chartModalEndTime]);

  return (
    <>
      <div className="monitor-chart">
        <HeaderPanel
          hasInfo={HAS_INFO_LINK_CHART.includes(metricType)}
          infoLink={MONITOR_HELP_LINK}
          title={graphTitle}
          contentNoPadding
          action={
            <>
              {!isTable && (
                <span
                  className="zoom"
                  onClick={() => {
                    setchartModalRangeType(rangeType);
                    setChartModalStartTime(startTime);
                    setChartModalEndTime(endTime);
                    setOpenModal(true);
                  }}
                >
                  <ZoomOutMapIcon />
                </span>
              )}
            </>
          }
        >
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
              <>
                <div className="chart-unit">{yAxisUnit}</div>
                <Chart options={options} height={260} series={series} />
              </>
            )}
          </div>
        </HeaderPanel>
      </div>
      <Modal
        title={graphTitle}
        isOpen={openModal}
        fullWidth={true}
        closeModal={() => {
          setOpenModal(false);
        }}
        actions={
          <div className="button-action no-pb text-right">
            <Button
              onClick={() => {
                setOpenModal(false);
              }}
            >
              {t("button.close")}
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <>
            <div className="modal-time-range">
              <div>&nbsp;</div>
              <TimeRange
                curTimeRangeType={chartModalRangeType}
                startTime={chartModalStartTime}
                endTime={chartModalEndTime}
                changeTimeRange={(range) => {
                  setChartModalStartTime(range[0]);
                  setChartModalEndTime(range[1]);
                }}
                changeRangeType={(type) => {
                  setchartModalRangeType(type);
                }}
              />
            </div>
            <div className="monitor-chart">
              <div className="pr">
                {loadingModalData && (
                  <div className="chart-mask">
                    <LoadingText />
                  </div>
                )}
                <div className="chart-unit">{yAxisUnit}</div>
                <Chart
                  options={chartModalOptions}
                  height={450}
                  series={chartModalSeries}
                />
              </div>
            </div>
          </>
        </div>
      </Modal>
    </>
  );
};

export default MonitorCharts;
