import Breadcrumb from "components/Breadcrumb";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import Select from "components/Select";
import { AntTab, AntTabs, TabPanel } from "components/Tab";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MonitorCharts from "./comps/MonitorCharts";
import { ActionType } from "reducer/appReducer";
import { useDispatch } from "react-redux";
import { KeyValueType, MonitorTable } from "./comps/MonitorTable";
import { appSyncRequestQuery } from "assets/js/request";
import { listCountry, listDistribution } from "graphql/queries";
import { SelectItem } from "components/Select/select";
// import DateRangePicker from "rsuite/esm/DateRangePicker";
// import "rsuite/dist/rsuite.min.css";
import LoadingText from "components/LoadingText";
import RefreshIcon from "@material-ui/icons/Refresh";
import Button from "components/Button";
import TimeRange from "./comps/TimeRange";
import { MetricType } from "assets/js/type";
import moment from "moment";

interface DistributionType {
  aliases: { Quantity: number; Items: string[] };
  domainName: string;
  enabled: string;
  id: string;
  snapshotCount: string;
  status: string;
  versionCount: string;
}

const CloudFrontMetrics: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("monitor:name"),
      link: "",
    },
  ];

  const [activeTab, setActiveTab] = useState(2);
  const [loadingCloudFront, setLoadingCloudFront] = useState(false);
  const [cloudFrontList, setCloudFrontList] = useState<SelectItem[]>([]);
  const [currentCloudFront, setCurrentCloudFront] = useState("");
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [startDate, setStartDate] = useState(
  //   encodeURI(moment().utc().add(-12, "hours").format("YYYY-MM-DD HH:mm:ss"))
  // );
  // const [endDate, setEndDate] = useState(
  //   encodeURI(moment.utc(new Date()).format("YYYY-MM-DD HH:mm:ss"))
  // );
  const [countryList, setCountryList] = useState<KeyValueType[]>([]);
  const [curCountryCode, setcurCountryCode] = useState("All");
  const [isRefresh, setIsRefresh] = useState(0);
  const [curTimeRangeType, setCurTimeRangeType] = useState("12h");

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    try {
      setLoadingCloudFront(true);
      const resData = await appSyncRequestQuery(listDistribution);
      console.info("resData:", resData);
      if (resData.data.listDistribution) {
        const tmpCloudFrontList: SelectItem[] = [];
        resData.data.listDistribution.forEach((element: DistributionType) => {
          // let tmpDomain = element.domainName;
          if (element?.aliases?.Items?.length > 0) {
            element?.aliases?.Items.forEach((domain: string) => {
              tmpCloudFrontList.push({
                name: `${domain}`,
                // name: `${element.domainName} | ${domain}`,
                value: domain,
              });
            });
          } else {
            tmpCloudFrontList.push({
              name: element.domainName,
              value: element.domainName,
            });
          }
        });
        setCloudFrontList(tmpCloudFrontList);
      }
      setLoadingCloudFront(false);
    } catch (error) {
      setLoadingCloudFront(false);
      console.error(error);
    }
  };

  const buildDataFromCountryString = (countryStr: string): KeyValueType => {
    if (countryStr && countryStr.length > 3) {
      countryStr = countryStr.substring(1, countryStr.length - 1);
      console.info("countryStr:", countryStr);
      const paramArr = countryStr.split(",");
      return {
        key: paramArr[0].split("=")?.[1],
        value: paramArr[1].split("=")?.[1],
      };
    }
    return {
      key: "",
      value: "",
    };
  };

  // Get Distribution List
  const getCountryList = async () => {
    try {
      setLoadingCountry(true);
      const resData = await appSyncRequestQuery(listCountry, {
        domain: currentCloudFront,
        start_time: Math.ceil(moment.utc(startDate).toDate().getTime() / 1000),
        end_time: Math.ceil(moment.utc(endDate).toDate().getTime() / 1000),
      });
      const tmpCountryStringList: string[] = resData?.data?.listCountry || [];
      if (tmpCountryStringList && tmpCountryStringList.length > 0) {
        const tmpCountryList: KeyValueType[] = [];
        const all = tmpCountryStringList.pop();
        [all, ...tmpCountryStringList].forEach((element: any) => {
          tmpCountryList.push(buildDataFromCountryString(element));
        });
        setCountryList(tmpCountryList);
      } else {
        setCountryList([]);
      }
      setLoadingCountry(false);
    } catch (error) {
      setLoadingCountry(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getCloudfrontDistributionList();
  }, []);

  useEffect(() => {
    console.info(
      "currentCloudFront && startDate && endDate",
      currentCloudFront,
      startDate,
      endDate
    );
    if (currentCloudFront && startDate && endDate) {
      getCountryList();
    }
  }, [currentCloudFront, startDate, endDate]);

  useEffect(() => {
    dispatch({ type: ActionType.CLOSE_SIDE_MENU });
    setActiveTab(0);
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <PagePanel
        title="CloudFront monitoring"
        actions={
          <>
            <Button
              btnType="icon"
              onClick={() => {
                setIsRefresh((prev) => {
                  return prev + 1;
                });
              }}
            >
              <RefreshIcon fontSize="small" /> Refresh
            </Button>
          </>
        }
      >
        <div className="monitor-cotainer">
          <div className="left-filter">
            <div>
              <HeaderPanel title="Choose a target to monitor">
                <FormItem optionTitle="Distribution" optionDesc="">
                  <Select
                    placeholder="Please select a distribution"
                    loading={loadingCloudFront}
                    optionList={cloudFrontList}
                    value={currentCloudFront}
                    onChange={(e) => {
                      setcurCountryCode("All");
                      setCurrentCloudFront(e.target.value);
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle="Date and time range (*UTC)"
                  optionDesc=""
                >
                  <TimeRange
                    curTimeRangeType={curTimeRangeType}
                    startTime={startDate}
                    endTime={endDate}
                    changeTimeRange={(range) => {
                      console.info("range:", range);
                      setStartDate(range[0]);
                      setEndDate(range[1]);
                    }}
                    changeRangeType={(type) => {
                      setCurTimeRangeType(type);
                    }}
                  />
                </FormItem>
              </HeaderPanel>
            </div>
            <div>
              <HeaderPanel title="Filter by country" contentNoPadding>
                {loadingCountry ? (
                  <div className="no-data">
                    <LoadingText />
                  </div>
                ) : (
                  <MonitorTable
                    showSelect
                    keyName="Country"
                    valueName="Total Requests"
                    list={countryList}
                    curCountryCode={curCountryCode}
                    changeCountryCode={(code) => {
                      setcurCountryCode(code);
                    }}
                  />
                )}
              </HeaderPanel>
            </div>
          </div>
          <div className="right-charts">
            <div>
              <AntTabs
                value={activeTab}
                onChange={(event, newTab) => {
                  setActiveTab(newTab);
                }}
              >
                <AntTab label="Requests / Error rate / Latency" />
                <AntTab label="Bandwidth / Data transfer" />
                <AntTab label="Cache hit rate / Cache result" />
              </AntTabs>
              <TabPanel value={activeTab} index={0}>
                <div className="monitor-chart-list">
                  <table className="chart-content-table" width="100%">
                    <tbody>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Requests"
                            yAxisUnit="Count"
                            metricType={MetricType.request}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Origin Requests"
                            yAxisUnit="Count"
                            metricType={MetricType.requestOrigin}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Requests latency"
                            yAxisUnit="Milliseconds (ms)"
                            metricType={MetricType.requestLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Origin Requests latency"
                            yAxisUnit="Milliseconds (ms)"
                            metricType={MetricType.requestOriginLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            rangeType={curTimeRangeType}
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Requests 3xx/4xx/5xx error rate"
                            yAxisUnit="Percentage (%)"
                            metricType={MetricType.statusCode}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Origin requests 3xx/4xx/5xx error rate"
                            yAxisUnit="Percentage (%)"
                            metricType={MetricType.statusCodeOrigin}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Requests 3xx/4xx/5xx error latency"
                            yAxisUnit="Milliseconds (ms)"
                            metricType={MetricType.statusCodeLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Origin requests 3xx/4xx/5xx error latency"
                            yAxisUnit="Milliseconds (ms)"
                            metricType={MetricType.statusCodeOriginLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Requests latency (> 1 sec) rate"
                            yAxisUnit="Percentage (%)"
                            metricType={MetricType.latencyRatio}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isTable
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Top 10 URLs with most requests"
                            yAxisUnit=""
                            metricType={MetricType.topNUrlRequests}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <div className="monitor-chart-list">
                  <table className="chart-content-table" width="100%">
                    <tbody>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Bandwidth"
                            yAxisUnit="Bps (Bits per second)"
                            metricType={MetricType.bandwidth}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Origin bandwidth"
                            yAxisUnit="Bps (Bits per second)"
                            metricType={MetricType.bandwidthOrigin}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Data transfer"
                            yAxisUnit="Bytes"
                            metricType={MetricType.downstreamTraffic}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isTable
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Top 10 URLs with most traffic"
                            yAxisUnit=""
                            metricType={MetricType.topNUrlSize}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabPanel>
              <TabPanel value={activeTab} index={2}>
                <div className="monitor-chart-list">
                  <table className="chart-content-table" width="100%">
                    <tbody>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Cache hit rate (calculated using requests)"
                            yAxisUnit="Percentage (%)"
                            metricType={MetricType.chr}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Cache hit rate (calculated using bandwidth)"
                            yAxisUnit="Percentage (%)"
                            metricType={MetricType.chrBandWidth}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Cache result"
                            yAxisUnit="Count"
                            metricType={MetricType.edgeType}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isRefresh={isRefresh}
                            curCountry={curCountryCode}
                            rangeType={curTimeRangeType}
                            domainName={currentCloudFront}
                            graphTitle="Cache result latency"
                            yAxisUnit="Milliseconds (ms)"
                            metricType={MetricType.edgeTypeLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabPanel>
            </div>
          </div>
        </div>
      </PagePanel>
    </div>
  );
};

export default CloudFrontMetrics;
