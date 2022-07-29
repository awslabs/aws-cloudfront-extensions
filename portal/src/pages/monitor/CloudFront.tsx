import { Cloudfront_info } from "API";
import { AMPLIFY_CONFIG_JSON } from "assets/js/const";
import { appSyncRequestMutation, appSyncRequestQuery } from "assets/js/request";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import { listDistribution } from "graphql/queries";
import { updateDomains } from "graphql/mutations";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import Select from "react-select";
import Modal from "components/Modal";
import MultiSelect from "components/MultiSelect";
import moment from "moment";
import { DeployExtensionObj } from "../deploy/Deploy";
import { useSelector } from "react-redux";
import { AmplifyConfigType } from "assets/js/type";
import { AppStateProps } from "reducer/appReducer";

import DateRangePicker from "rsuite/DateRangePicker";
import "rsuite/dist/rsuite.min.css";

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

interface OptionType {
  label: string;
  value: string;
}
interface ChooseCloudFrontProps {
  deployExtensionObj: DeployExtensionObj;
  changeExtensionObjDistribution: (distribution: OptionType) => void;
}

const CloudFront: React.FC = () => {
  const chartOption = {
    chart: {
      height: 450,
      type: "line",
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: false,
      },
    },
  };

  const { allowedMaxDays, combine, allowedRange, afterToday } = DateRangePicker;
  const [loadingData, setLoadingData] = useState(false);
  const [cloudFrontList, setCloudFrontList] = useState<any[]>([]);
  const [selectDistribution, setSelectDistribution] = useState<any>([]);
  const [selectDistributionName, setSelectDistributionName] = useState<any>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirm, setConfirm] = useState("");

  const [cdnRequestData, setCdnRequestData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnRequestOriginData, setCdnRequestOriginData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnStatusCodeData, setCdnStatusCodeData] = useState([
    { Time: "", Value: [{ StatusCode: 0, Count: 0 }] },
  ]);
  const [cdnStatusCodeOriginData, setCdnStatusCodeOriginData] = useState([
    { Time: "", Value: [{ StatusCode: 0, Count: 0 }] },
  ]);
  const [cdnChrData, setCdnChrData] = useState([{ Time: "", Value: 0 }]);
  const [cdnChrBandWithData, setCdnChrBandWithData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnBandWithData, setCdnBandWithData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnBandWithOriginData, setCdnBandWithOriginData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnDownloadSpeedData, setCdnDownloadSpeedData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnDownloadSpeedOriginData, setCdnDownloadSpeedOriginData] = useState([
    { Time: "", Value: 0 },
  ]);
  const [cdnTopNUrlRequestsData, setCdnTopNUrlRequestsData] = useState([
    { Time: "", Value: [{ Path: "", Count: 0 }] },
  ]);
  const [cdnTopNUrlSizeData, setCdnTopNUrlSizeData] = useState([
    { Time: "", Value: [{ Path: "", Size: 0 }] },
  ]);
  const [cdnDownstreamTrafficData, setCdnDownstreamTrafficData] = useState([
    { Time: "", Value: 0 },
  ]);
  const amplifyConfig: AmplifyConfigType = useSelector(
    (state: AppStateProps) => state.amplifyConfig
  );

  const dateFormatter = (str: "") => {
    return str;
  };
  const [value, setValue] = React.useState<Date | null>(
    new Date("2014-08-18T21:11:54")
  );

  const handleChange = (newValue: Date | null) => {
    setValue(newValue);
  };

  console.log("aws_monitoring_url:" + amplifyConfig.aws_monitoring_url);

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    try {
      const resData = await appSyncRequestQuery(listDistribution);
      const Cloudfront_info_list: any[] = resData.data.listDistribution;
      const tmpDistributionList = [];
      const tmpSelectedList = [];

      const domainData = await appSyncRequestMutation(updateDomains, {
        stack_name: "MonitoringStack",
        domains: ["0"],
      });
      const domainList: string[] = [];
      if (domainData.data.updateDomains.includes(",")) {
        const domains = domainData.data.updateDomains.split(",");
        for (const index in domains) {
          domainList.push(domains[index].trim());
        }
      } else {
        domainList.push(domainData.data.updateDomains.trim());
      }

      for (const cfdistlistKey in Cloudfront_info_list) {
        const cname =
          Cloudfront_info_list[cfdistlistKey].aliases.Quantity === 0
            ? ""
            : " | " + Cloudfront_info_list[cfdistlistKey].aliases.Items[0];
        if (
          domainList.includes(Cloudfront_info_list[cfdistlistKey].domainName)
        ) {
          tmpSelectedList.push({
            label: Cloudfront_info_list[cfdistlistKey].domainName + cname,
            name: Cloudfront_info_list[cfdistlistKey].domainName + cname,
            value: Cloudfront_info_list[cfdistlistKey].domainName,
          });
        }
        tmpDistributionList.push({
          label: Cloudfront_info_list[cfdistlistKey].domainName + cname,
          name: Cloudfront_info_list[cfdistlistKey].domainName + cname,
          value: Cloudfront_info_list[cfdistlistKey].domainName,
        });
      }
      setCloudFrontList(tmpDistributionList);
      setSelectDistribution(tmpSelectedList);

      const selectList: any = [];
      for (const index in tmpSelectedList) {
        selectList.push(tmpSelectedList[index].name);
      }
      setSelectDistributionName(() => {
        return selectList;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getChartData = async (domain: string) => {
    let url2 =
      amplifyConfig.aws_monitoring_url +
      "/metric?StartTime=" +
      startDate +
      "&EndTime=" +
      endDate +
      "&Metric=all&" +
      domain;
    try {
      const response = await fetch(url2, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": amplifyConfig.aws_monitoring_api_key,
        },
      });
      const data = await response.json();
      data.Data[0].CdnData.forEach(
        (item: { Metric: string; DetailData: [] }) => {
          if (item.Metric == "request") {
            setCdnRequestData(item.DetailData);
          } else if (item.Metric == "requestOrigin") {
            setCdnRequestOriginData(item.DetailData);
          } else if (item.Metric == "statusCode") {
            setCdnStatusCodeData(item.DetailData);
          } else if (item.Metric == "statusCodeOrigin") {
            setCdnStatusCodeOriginData(item.DetailData);
          } else if (item.Metric == "chr") {
            setCdnChrData(item.DetailData);
          } else if (item.Metric == "chrBandWith") {
            setCdnChrBandWithData(item.DetailData);
          } else if (item.Metric == "bandwidth") {
            setCdnBandWithData(item.DetailData);
          } else if (item.Metric == "bandwidthOrigin") {
            setCdnBandWithOriginData(item.DetailData);
          } else if (item.Metric == "downloadSpeed") {
            setCdnDownloadSpeedData(item.DetailData);
          } else if (item.Metric == "downloadSpeedOrigin") {
            setCdnDownloadSpeedOriginData(item.DetailData);
          } else if (item.Metric == "topNUrlRequests") {
            setCdnTopNUrlRequestsData(item.DetailData);
          } else if (item.Metric == "topNUrlSize") {
            setCdnTopNUrlSizeData(item.DetailData);
          } else if (item.Metric == "downstreamTraffic") {
            setCdnDownstreamTrafficData(item.DetailData);
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getCloudfrontDistributionList();
  }, []);

  const getCdnStatusCode = (num: number) => {
    const status: number | null[] = [];
    cdnStatusCodeData.map(function (element) {
      let code = null;
      element.Value.map(function (obj) {
        if (obj.StatusCode == num) {
          code = obj.Count;
        }
      });
      status.push(code);
    });
    return status;
  };

  const getCdnStatusCodeOrigin = () => {
    const status: number[] = [];
    cdnStatusCodeOriginData.map(function (element) {
      element.Value.map(function (obj) {
        if (!status.includes(obj.StatusCode)) {
          status.push(obj.StatusCode);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    status.map(function (code) {
      const data: any[] = [];
      cdnStatusCodeOriginData.map(function (element) {
        let found = false;
        element.Value.map(function (obj) {
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

  const getCdnTopNUrlRequestsData = () => {
    const topurl: string[] = [];
    const count: number[][] = [];
    cdnTopNUrlRequestsData.map(function (element) {
      element.Value.map(function (obj) {
        if (!topurl.includes(obj.Path)) {
          topurl.push(obj.Path);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    topurl.map(function (url) {
      const data: any[] = [];
      cdnTopNUrlRequestsData.map(function (element) {
        let found = false;
        element.Value.map(function (obj) {
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

  const getCdnTopNUrlSizeData = () => {
    const topurl: string[] = [];
    const count: number[][] = [];
    cdnTopNUrlSizeData.map(function (element) {
      element.Value.map(function (obj) {
        if (!topurl.includes(obj.Path)) {
          topurl.push(obj.Path);
        }
      });
    });
    const series: { name: string; data: any[] }[] = [];
    topurl.map(function (url) {
      const data: any[] = [];
      cdnTopNUrlSizeData.map(function (element) {
        let found = false;
        element.Value.map(function (obj) {
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

  const selectAllDistributions = () => {
    const selectList: any = [];
    for (const index in cloudFrontList) {
      selectList.push(cloudFrontList[index].value);
    }
    setSelectDistributionName(() => {
      return selectList;
    });
    setSelectDistribution(() => {
      return selectList;
    });
  };

  useEffect(() => {}, [selectDistribution]);

  useEffect(() => {}, [selectDistributionName]);

  const selectNoneDistributions = async () => {
    setSelectDistributionName([]);
    setSelectDistribution([]);
  };

  const applyDomainList = async () => {
    try {
      setLoadingApply(true);
      const resData = await appSyncRequestMutation(updateDomains, {
        stack_name: "MonitoringStack",
        domains: selectDistribution,
      });
      await getCloudfrontDistributionList();
      setLoadingApply(false);
      setOpenModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const selectDomainList = async () => {
    try {
      const resData = await appSyncRequestMutation(updateDomains, {
        stack_name: "MonitoringStack",
        domains: ["0"],
      });
      const selectList: any = [];
      for (const index in selectDistribution) {
        selectList.push(selectDistribution[index].value);
      }
      setSelectDistribution(() => {
        return selectList;
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <HeaderPanel
        title="Monitoring"
        action={
          <div>
            <Button
              btnType="primary"
              onClick={() => {
                setOpenModal(true);
                // getCloudfrontDistributionList();
                // selectDomainList();
              }}
            >
              Update Domain List
            </Button>
          </div>
        }
      >
        <FormItem
          optionTitle="Distributions"
          optionDesc={<div>Choose a CloudFront distribution</div>}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 400px",
              gridGap: 20,
            }}
          >
            <Select
              options={selectDistribution}
              onChange={(event: any) => {
                if (event != null) {
                  getChartData(event.value);
                }
              }}
            />
            <DateRangePicker
              format="yyyy-MM-dd hh:mm"
              disabledDate={afterToday?.()}
              onChange={(range) => {
                if (range != null) {
                  setStartDate(
                    encodeURI(moment(range[0]).format("YYYY-MM-DD hh:mm:ss"))
                  );
                  setEndDate(
                    encodeURI(moment(range[1]).format("YYYY-MM-DD hh:mm:ss"))
                  );
                }
              }}
            />
          </div>
        </FormItem>
        <div className="flex flex-warp">
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  type: "datetime",
                  categories: cdnRequestData.map((element) => element.Time),
                },
                title: {
                  text: "Request",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnRequestData.map((element) => element.Value),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnRequestOriginData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "Request Origin",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnRequestOriginData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnStatusCodeData.map((element) => element.Time),
                },
                title: {
                  text: "Status Code",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "200",
                  data: getCdnStatusCode(200),
                },
                {
                  name: "400",
                  data: getCdnStatusCode(400),
                },
                {
                  name: "404",
                  data: getCdnStatusCode(404),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnStatusCodeOriginData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "Status Code Origin",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={getCdnStatusCodeOrigin()}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnChrData.map((element) => element.Time),
                },
                title: {
                  text: "CHR",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnChrData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnChrBandWithData.map((element) => element.Time),
                },
                title: {
                  text: "CHR BandWith",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnChrBandWithData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnBandWithData.map((element) => element.Time),
                },
                title: {
                  text: "BandWith",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnBandWithData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnBandWithOriginData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "BandWith Origin",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnBandWithOriginData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnDownloadSpeedData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "Download Speed",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnDownloadSpeedData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnDownloadSpeedOriginData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "Download Speed Origin",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnDownloadSpeedOriginData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnTopNUrlRequestsData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "Top NUrl Requests",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={getCdnTopNUrlRequestsData()}
              type="line"
              width="450"
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnTopNUrlSizeData.map((element) => element.Time),
                },
                title: {
                  text: "Top NUrl Size",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={getCdnTopNUrlSizeData()}
            />
          </div>
          <div className="chart-item">
            <Chart
              options={{
                xaxis: {
                  categories: cdnDownstreamTrafficData.map(
                    (element) => element.Time
                  ),
                },
                title: {
                  text: "Downstream Traffic",
                },
                chart: {
                  height: 450,
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
                dataLabels: {
                  enabled: true,
                },
                stroke: {
                  width: 2,
                },
              }}
              series={[
                {
                  name: "Value",
                  data: cdnDownstreamTrafficData.map(function (item) {
                    return item.Value;
                  }),
                },
              ]}
              type="line"
              width="450"
            />
          </div>
        </div>
      </HeaderPanel>
      <Modal
        title="Update Domain List"
        isOpen={openModal}
        fullWidth={true}
        closeModal={() => {
          setOpenModal(false);
        }}
        actions={
          <div className="button-action no-pb text-right">
            <Button
              onClick={() => {
                setConfirm("");
                setOpenModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              btnType="primary"
              loading={loadingApply}
              onClick={() => {
                applyDomainList();
              }}
            >
              Apply
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <FormItem
            optionTitle="Distribution"
            optionDesc="Distribution to apply configurations"
          >
            <div className="flex">
              <div style={{ width: 800 }}>
                <MultiSelect
                  optionList={cloudFrontList}
                  value={selectDistributionName}
                  placeholder="Select distribution"
                  onChange={(items) => {
                    setSelectDistribution(items);
                  }}
                />
              </div>
              <div className="ml-5">
                <Button
                  onClick={() => {
                    selectAllDistributions();
                  }}
                >
                  Select All
                </Button>
              </div>
              <div className="ml-5">
                <Button
                  onClick={() => {
                    selectNoneDistributions();
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </FormItem>
        </div>
      </Modal>
    </div>
  );
};

export default CloudFront;
