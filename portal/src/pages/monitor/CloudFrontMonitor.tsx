import RefreshIcon from "@material-ui/icons/Refresh";
import { appSyncRequestMutation, appSyncRequestQuery } from "assets/js/request";
import { AmplifyConfigType } from "assets/js/type";
import Alert from "components/Alert";
import { AlertType } from "components/Alert/alert";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import Modal from "components/Modal";
import MultiSelect from "components/MultiSelect";
import { updateDomains } from "graphql/mutations";
import { listDistribution } from "graphql/queries";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Select from "react-select";
import { AppStateProps } from "reducer/appReducer";
import DateRangePicker from "rsuite/DateRangePicker";
import "rsuite/dist/rsuite.min.css";
import MetricChart from "./MetricChart";

const CloudFrontMonitor: React.FC = () => {
  const { t } = useTranslation();
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

  const { afterToday } = DateRangePicker;
  const [cloudFrontList, setCloudFrontList] = useState<any[]>([]);
  const [selectDistribution, setSelectDistribution] = useState<any>([]);
  const [selectDistributionName, setSelectDistributionName] = useState<any>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [startDate, setStartDate] = useState(
    encodeURI(moment().utc().add(-12, "hours").format("YYYY-MM-DD HH:mm:ss"))
  );
  const [endDate, setEndDate] = useState(
    encodeURI(moment.utc(new Date()).format("YYYY-MM-DD HH:mm:ss"))
  );
  const [selectDomain, setSelectDomain] = useState("");
  const [loadingDomain, setLoadingDomain] = useState(true);

  const amplifyConfig: AmplifyConfigType = useSelector(
    (state: AppStateProps) => state.amplifyConfig
  );

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    try {
      const resData = await appSyncRequestQuery(listDistribution);
      const Cloudfront_info_list: any[] = resData.data.listDistribution;
      const tmpDistributionList = [];
      const tmpSelectedList = [];
      setLoadingDomain(true);
      const domainData = await appSyncRequestMutation(updateDomains, {
        stack_name: "",
        domains: "*",
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
          domainList.includes(Cloudfront_info_list[cfdistlistKey].domainName) ||
          domainList.includes("ALL") ||
          domainList.includes("All") ||
          domainList.includes("all")
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
        selectList.push(tmpSelectedList[index].value);
      }
      setSelectDistributionName(selectList);
      setLoadingDomain(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getCloudfrontDistributionList();
  }, []);

  const selectAllDistributions = () => {
    const selectList: any = [];
    for (const index in cloudFrontList) {
      selectList.push(cloudFrontList[index].value);
    }
    setSelectDistributionName(selectList);
    setSelectDistribution(selectList);
  };

  const selectNoneDistributions = async () => {
    setSelectDistributionName([]);
    setSelectDistribution([]);
  };

  const applyDomainList = async () => {
    try {
      setLoadingApply(true);
      await appSyncRequestMutation(updateDomains, {
        stack_name: amplifyConfig.aws_monitoring_stack_name,
        domains: selectDistribution,
      });
      await getCloudfrontDistributionList();
      setLoadingApply(false);
      setOpenModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      {amplifyConfig.aws_monitoring_url === "" && (
        <Alert type={AlertType.Error} content={t("monitor:cloudfront.alert")} />
      )}

      <HeaderPanel
        title={t("monitor:cloudFront.monitoring")}
        action={
          <div>
            <Button
              disabled={amplifyConfig.aws_monitoring_url === ""}
              btnType="primary"
              onClick={() => {
                setOpenModal(true);
              }}
            >
              {t("button.updateDomainList")}
            </Button>
          </div>
        }
      >
        <FormItem
          optionTitle={t("distributions")}
          optionDesc={<div>{t("monitor:cloudFront.chooseDistribution")}</div>}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 400px 50px",
              gridGap: 20,
            }}
          >
            <Select
              isLoading={loadingDomain}
              options={selectDistribution}
              isDisabled={amplifyConfig.aws_monitoring_url === ""}
              onChange={(event: any) => {
                if (event !== null) {
                  let domainName = event.value;
                  if (event.name.indexOf("|") > 0) {
                    domainName = event.name
                      .substring(event.name.indexOf("|") + 1)
                      .trim();
                  }
                  setSelectDomain(domainName);
                }
              }}
            />
            <DateRangePicker
              disabled={amplifyConfig.aws_monitoring_url === ""}
              format="yyyy-MM-dd HH:mm"
              defaultValue={[moment().add(-12, "hours").toDate(), new Date()]}
              disabledDate={afterToday?.()}
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
            <Button
              disabled={amplifyConfig.aws_monitoring_url === ""}
              onClick={() => {
                // getChartData();
              }}
            >
              <RefreshIcon fontSize="medium" />
            </Button>
          </div>
        </FormItem>
        <div className="flex flex-warp">
          <MetricChart
            title={t("monitor:cloudFront.chart.request")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="request"
          />
          <MetricChart
            title={t("monitor:cloudFront.chart.requestOrigin")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="requestOrigin"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.statusCode")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="statusCode"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.statusCodeOrigin")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="statusCodeOrigin"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.cacheHitRate")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="chr"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.cacheHitRateBW")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="chrBandWidth"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.bandWidth")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="bandwidth"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.bandWidthOrigin")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="bandwidthOrigin"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.latencyRatio")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="bandwidthOrigin"
          />

          {amplifyConfig.aws_monitoring_stack_name ===
            "RealtimeMonitoringStack" && (
            <>
              <MetricChart
                title={t("monitor:cloudFront.chart.downloadSpeed")}
                selectDomain={selectDomain}
                startDate={startDate}
                endDate={endDate}
                metricType="downloadSpeed"
              />
              <MetricChart
                title={t("monitor:cloudFront.chart.downloadSpeedOrigin")}
                selectDomain={selectDomain}
                startDate={startDate}
                endDate={endDate}
                metricType="downloadSpeedOrigin"
              />
            </>
          )}

          <MetricChart
            title={t("monitor:cloudFront.chart.topNUrlReq")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="topNUrlRequests"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.topNUrlSize")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="topNUrlRequests"
          />

          <MetricChart
            title={t("monitor:cloudFront.chart.downStreamTraffic")}
            selectDomain={selectDomain}
            startDate={startDate}
            endDate={endDate}
            metricType="topNUrlRequests"
          />
        </div>
      </HeaderPanel>
      <Modal
        title={t("monitor:cloudFront.updateDomainList")}
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
              {t("button.cancel")}
            </Button>
            <Button
              btnType="primary"
              loading={loadingApply}
              onClick={() => {
                applyDomainList();
              }}
            >
              {t("button.apply")}
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <FormItem
            optionTitle={t("distribution")}
            optionDesc={t("monitor:cloudFront.applyConfig")}
          >
            <div className="flex">
              <div style={{ width: 800 }}>
                <MultiSelect
                  optionList={cloudFrontList}
                  value={selectDistributionName}
                  placeholder={t("monitor:cloudFront.selectDistribution")}
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
                  {t("button.selectAll")}
                </Button>
              </div>
              <div className="ml-5">
                <Button
                  onClick={() => {
                    selectNoneDistributions();
                  }}
                >
                  {t("button.clear")}
                </Button>
              </div>
            </div>
          </FormItem>
        </div>
      </Modal>
    </div>
  );
};

export default CloudFrontMonitor;
