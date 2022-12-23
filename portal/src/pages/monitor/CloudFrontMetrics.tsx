import Breadcrumb from "components/Breadcrumb";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import Select from "components/Select";
import { AntTab, AntTabs, TabPanel } from "components/Tab";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MonitorCharts from "./comps/MonitorCharts";
import { ActionType, AppStateProps } from "reducer/appReducer";
import { useDispatch, useSelector } from "react-redux";
import { KeyValueType, MonitorTable } from "./comps/MonitorTable";
import { appSyncRequestQuery } from "assets/js/request";
import { listCountry, listDistribution } from "graphql/queries";
import { SelectItem } from "components/Select/select";
import DateRangePicker from "rsuite/esm/DateRangePicker";
import moment from "moment";
import "rsuite/dist/rsuite.min.css";
import { AmplifyConfigType } from "assets/js/type";
import LoadingText from "components/LoadingText";

export enum MetricType {
  request = "request",
  requestOrigin = "requestOrigin",
  requestLatency = "requestLatency",
  requestOriginLatency = "requestOriginLatency",
  statusCode = "statusCode",
  statusCodeOrigin = "statusCodeOrigin",
  statusCodeLatency = "statusCodeLatency",
  statusCodeOriginLatency = "statusCodeOriginLatency",
  latencyRatio = "latencyRatio",
  topNUrlRequests = "topNUrlRequests",

  bandwidth = "bandwidth",
  bandwidthOrigin = "bandwidthOrigin",
  downstreamTraffic = "downstreamTraffic",
  topNUrlSize = "topNUrlSize",

  chr = "chr",
  chrBandWidth = "chrBandWidth",
  edgeType = "edgeType",
  edgeTypeLatency = "edgeTypeLatency",
}

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
  const amplifyConfig: AmplifyConfigType = useSelector(
    (state: AppStateProps) => state.amplifyConfig
  );
  const [activeTab, setActiveTab] = useState(2);
  const [loadingCloudFront, setLoadingCloudFront] = useState(false);
  const [cloudFrontList, setCloudFrontList] = useState<SelectItem[]>([]);
  const [currentCloudFront, setCurrentCloudFront] = useState("");
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [startDate, setStartDate] = useState(
    encodeURI(moment().utc().add(-12, "hours").format("YYYY-MM-DD HH:mm:ss"))
  );
  const [endDate, setEndDate] = useState(
    encodeURI(moment.utc(new Date()).format("YYYY-MM-DD HH:mm:ss"))
  );
  const [countryList, setCountryList] = useState<KeyValueType[]>([]);
  const [curCountryCode, setcurCountryCode] = useState("All");

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
        start_time: Math.ceil(new Date(decodeURI(startDate)).getTime() / 1000),
        end_time: Math.ceil(new Date(decodeURI(endDate)).getTime() / 1000),
      });
      const tmpCountryStringList: string[] = resData?.data?.listCountry || [];
      const tmpCountryList: KeyValueType[] = [];
      tmpCountryStringList.sort().forEach((element) => {
        tmpCountryList.push(buildDataFromCountryString(element));
      });
      setCountryList(tmpCountryList);
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
      <PagePanel title="CloudFront monitoring">
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
                <FormItem optionTitle="Date and time range" optionDesc="">
                  <DateRangePicker
                    disabled={amplifyConfig.aws_monitoring_url === ""}
                    format="yyyy-MM-dd HH:mm"
                    defaultValue={[
                      moment().add(-12, "hours").toDate(),
                      new Date(),
                    ]}
                    // disabledDate={afterToday?.()}
                    onChange={(range) => {
                      if (range !== null) {
                        setStartDate(
                          encodeURI(
                            moment.utc(range[0]).format("YYYY-MM-DD HH:mm:ss")
                          )
                        );
                        setEndDate(
                          encodeURI(
                            moment.utc(range[1]).format("YYYY-MM-DD HH:mm:ss")
                          )
                        );
                      }
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
                    valueName="Requests"
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
                <AntTab label="Requests/ StatusCode/ Latency" />
                <AntTab label="Bandwidth/ Downstream Traffic" />
                <AntTab label="Cache Hit Rate/ Cache result type" />
              </AntTabs>
              <TabPanel value={activeTab} index={0}>
                <div className="monitor-chart-list">
                  <table className="chart-content-table" width="100%">
                    <tbody>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            curCountry={curCountryCode}
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
                            curCountry={curCountryCode}
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
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Requests latency"
                            yAxisUnit=""
                            metricType={MetricType.requestLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Origen Requests latency"
                            yAxisUnit=""
                            metricType={MetricType.requestOriginLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Status code count"
                            yAxisUnit=""
                            metricType={MetricType.statusCode}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Origin status code count"
                            yAxisUnit=""
                            metricType={MetricType.statusCodeOrigin}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Status code latency"
                            yAxisUnit=""
                            metricType={MetricType.statusCodeLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Origin status code latency"
                            yAxisUnit=""
                            metricType={MetricType.statusCodeOriginLatency}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Lantency (Time taken > 1 sec)"
                            yAxisUnit=""
                            metricType={MetricType.latencyRatio}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isTable
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Top 10 URL with most requests"
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
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Bandwidth"
                            yAxisUnit="BPS(Byte per second)"
                            metricType={MetricType.bandwidth}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Origin Bandwidth"
                            yAxisUnit="BPS(Byte per second)"
                            metricType={MetricType.bandwidthOrigin}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Downstream traffic"
                            yAxisUnit="Bytes"
                            metricType={MetricType.downstreamTraffic}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            isTable
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Top 10 URL with most traffic"
                            yAxisUnit="Bytes"
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
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Cache Hit Rate(Calculated based on Requests)"
                            yAxisUnit="Percentage(%)"
                            metricType={MetricType.chr}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="Cache Hit Rate(Calculated based on Bandwidth)"
                            yAxisUnit="Percentage(%)"
                            metricType={MetricType.chrBandWidth}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: "50%" }}>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="x-edge-response-result-type-count"
                            yAxisUnit="Count"
                            metricType={MetricType.edgeType}
                            startTime={startDate}
                            endTime={endDate}
                          />
                        </td>
                        <td>
                          <MonitorCharts
                            curCountry={curCountryCode}
                            domainName={currentCloudFront}
                            graphTitle="x-edge-response-result-type average latency"
                            yAxisUnit="time(minllseconds)"
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
