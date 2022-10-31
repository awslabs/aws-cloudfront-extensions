import React, { useEffect, useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import HeaderPanel from "components/HeaderPanel";
import { useNavigate, useParams } from "react-router-dom";
import ValueWithLabel from "components/ValueWithLabel";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import { useDispatch } from "react-redux";
import { ActionType } from "reducer/appReducer";
import ArrowDown from "assets/images/config/arrowDown.png";
import StatusItem, { StatusTypeStep } from "./StatusItem";
import { appSyncRequestQuery } from "../../../assets/js/request";
import {
  getJobInfo,
  listCertificationsWithJobId,
  listCloudFrontArnWithJobId,
} from "../../../graphql/queries";
import { SSLJob } from "../../../API";
import Modal from "../../../components/Modal";
import { SelectType, TablePanel } from "../../../components/TablePanel";
import { useTranslation } from "react-i18next";

const JobDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jobId } = useParams();
  const [certValidationPercentage, setCertValidationPercentage] =
    useState<any>(0);
  const [overallStatus, setOverallStatus] = useState("");
  const [jobInfo, setJobInfo] = useState<any>({
    jobId: jobId || "",
    cert_completed_number: 0,
    cert_total_number: 0,
    cloudfront_distribution_created_number: 0,
    cloudfront_distribution_total_number: 0,
    job_input: "",
    certCreateStageStatus: "INPROGRESS",
    certValidationStageStatus: "NOTSTART",
    creationDate: "2022-01-01",
    distStageStatus: "NOTSTART",
    jobType: "create",
    promptInfo: "",
    dcv_validation_msg: "",
  });
  const [loadingData, setLoadingData] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openCloudfrontModal, setOpenCloudfrontModal] = useState(false);
  const [certArnList, setCertArnList] = useState<any>([]);
  const [cloudfrontArnList, setCloudFrontArnList] = useState<any>([]);
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("ssl:certJobList"),
      link: "/config/certification/jobs",
    },
    {
      name: jobId || "",
    },
  ];

  useEffect(() => {
    dispatch({ type: ActionType.CLOSE_SIDE_MENU });
  }, []);

  // Get Version List By Distribution
  const fetchJobInfo = async () => {
    try {
      // setLoadingData(true);
      const resData = await appSyncRequestQuery(getJobInfo, {
        jobId: jobId,
      });
      const jobInfo: SSLJob = resData.data.getJobInfo;
      setJobInfo(jobInfo);
    } catch (error) {
      // setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchJobInfo();
  }, []);

  // Get Version List By Distribution
  const fetchCertList = async () => {
    try {
      setLoadingData(true);
      const resData = await appSyncRequestQuery(listCertificationsWithJobId, {
        jobId: jobId,
      });
      const certList: [string] = resData.data.listCertificationsWithJobId;
      setCertArnList(certList);
      setLoadingData(false);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchCertList();
  }, [jobId, jobInfo]);

  // Get Distribution by job Id
  const fetchCloudFrontList = async () => {
    try {
      // setLoadingData(true);
      const resData = await appSyncRequestQuery(listCloudFrontArnWithJobId, {
        jobId: jobId,
      });
      const cloudfrontArnList: [string] =
        resData.data.listCloudFrontArnWithJobId;
      setCloudFrontArnList(cloudfrontArnList);
    } catch (error) {
      // setLoadingData(false);
      console.error(error);
    }
  };
  useEffect(() => {
    fetchCloudFrontList();
  }, [jobId, jobInfo]);

  const getCertValidationPercentage = () => {
    if (jobInfo.cloudfront_distribution_created_number > 0) {
      setCertValidationPercentage(100);
    } else {
      if (jobInfo.cert_total_number > 0) {
        setCertValidationPercentage(
          Math.round(
            (jobInfo.cert_completed_number / jobInfo.cert_total_number) * 100
          )
        );
      } else {
        setCertValidationPercentage(0);
      }
    }
  };

  useEffect(() => {
    getCertValidationPercentage();
  }, [jobInfo]);

  const getOverallStatus = () => {
    if (
      jobInfo.certCreateStageStatus === "SUCCESS" &&
      jobInfo.distStageStatus === "SUCCESS"
    ) {
      setOverallStatus("SUCCESS");
    } else if (
      jobInfo.certCreateStageStatus === "FAILED" ||
      jobInfo.distStageStatus === "FAILED" ||
      jobInfo.certValidationStageStatus === "FAILED"
    ) {
      setOverallStatus("FAILED");
    } else {
      setOverallStatus("INPROGRESS");
    }
  };

  useEffect(() => {
    getOverallStatus();
  }, [jobInfo]);

  useEffect(() => {
    fetchJobInfo();
    const refreshInterval = setInterval(() => {
      fetchJobInfo();
    }, 20000);
    return () => clearInterval(refreshInterval);
  }, []);

  const constructCloudfrontLink = (arn: string) => {
    const tmpArr = arn.split("/");
    return tmpArr[1];
  };

  const constructCertificateConsoleLink = (arn: string) => {
    const tmpArr = arn.split(":");
    const region = tmpArr[3];
    const tmp = arn.split("/");
    const certId = tmp[1];
    return (
      "https://us-east-1.console.aws.amazon.com/acm/home?region=" +
      region +
      "#/certificates/" +
      certId
    );
  };
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="pb-50">
        <HeaderPanel
          title={t("ssl:jobDetail.jobOverview")}
          desc={jobInfo.jobType}
          action={
            <div>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/list");
                }}
              >
                {t("button.backToCert")}
              </Button>
              <Button
                className="ml-10"
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/jobs");
                }}
              >
                {t("button.backToJob")}
              </Button>
            </div>
          }
        >
          <div className="flex value-label-span">
            <div>
              <ValueWithLabel label={t("ssl:jobDetail.overallStatus")}>
                <div className={overallStatus?.toLocaleLowerCase()}>
                  {overallStatus}
                </div>
              </ValueWithLabel>
            </div>
            <div className="flex-1 border-left-c">
              <ValueWithLabel label={t("ssl:jobDetail.curExpCert")}>
                <div className="flex">
                  <div className="job-status-number">
                    {certArnList.length + "/" + jobInfo.cert_total_number}
                  </div>
                  <div className="flex-1">
                    <Button
                      onClick={() => {
                        setOpenModal(true);
                      }}
                    >
                      {t("button.viewCertInJob")}
                      <span>
                        <OpenInNewIcon />
                      </span>
                    </Button>
                  </div>
                </div>
              </ValueWithLabel>
            </div>
            <div className="flex-1 border-left-c">
              <ValueWithLabel label={t("ssl:jobDetail.curExpCF")}>
                <div className="flex">
                  <div className="job-status-number">
                    {jobInfo.cloudfront_distribution_created_number +
                      "/" +
                      jobInfo.cloudfront_distribution_total_number}
                  </div>
                  <div className="flex-1">
                    <Button
                      onClick={() => {
                        setOpenCloudfrontModal(true);
                      }}
                    >
                      {t("button.viewCFInJob")}
                      <span>
                        <OpenInNewIcon />
                      </span>
                    </Button>
                  </div>
                </div>
              </ValueWithLabel>
            </div>
          </div>
        </HeaderPanel>

        <HeaderPanel
          title={t("ssl:jobDetail.jobStatus")}
          action={
            <div>{/*<Button btnType="text">More resources</Button>*/}</div>
          }
        >
          <div>
            {
              <div className="job-status-list">
                <StatusItem
                  stepNo="1"
                  isAuto
                  step={StatusTypeStep.RequestSSLCert}
                  status={jobInfo.certCreateStageStatus}
                  progress={
                    (jobInfo.cert_completed_number /
                      jobInfo.cert_total_number) *
                    100
                  }
                  progressTopText={t("ssl:jobDetail.requestCert")}
                  // progressBottomText="The step will be completed if all SSL certificates were created"
                  progressBottomText={
                    jobInfo.certCreateStageStatus === "FAILED"
                      ? jobInfo.promptInfo
                      : t("ssl:jobDetail.promptInfo")
                  }
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="2"
                  isAuto={false}
                  step={StatusTypeStep.ValidateCert}
                  status={jobInfo.certValidationStageStatus}
                  progress={certValidationPercentage}
                  progressTopText={t("ssl:jobDetail.validateCertTop")}
                  progressBottomText={
                    t("ssl:jobDetail.validateCertBottom") +
                    "\n" +
                    jobInfo.dcv_validation_msg
                  }
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="3"
                  isAuto
                  step={StatusTypeStep.CreateCloudFront}
                  status={jobInfo.distStageStatus}
                  progress={
                    (jobInfo.cloudfront_distribution_created_number /
                      jobInfo.cloudfront_distribution_total_number) *
                    100
                  }
                  progressTopText={t("ssl:jobDetail.createCFTop")}
                  progressBottomText={
                    jobInfo.distStageStatus === "FAILED"
                      ? jobInfo.promptInfo
                      : t("ssl:jobDetail.createCFBottom")
                  }
                />
              </div>
            }
          </div>
        </HeaderPanel>
        <Modal
          title=""
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
                {t("button.ok")}
              </Button>
            </div>
          }
        >
          <TablePanel
            loading={loadingData}
            title=""
            selectType={SelectType.NONE}
            actions={<div></div>}
            pagination={<div />}
            items={certArnList}
            columnDefinitions={[
              {
                id: "Arn",
                header: t("ssl:jobDetail.certArn"),
                cell: (e: string) => {
                  return (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={constructCertificateConsoleLink(e)}
                    >
                      {e}
                    </a>
                  );
                },
                // sortingField: "alt",
              },
            ]}
            changeSelected={() => {
              // console.info("select item:", item);
              // setSelectedItems(item);
              // setcnameList(MOCK_REPOSITORY_LIST);
            }}
          />
        </Modal>
        <Modal
          title=""
          isOpen={openCloudfrontModal}
          fullWidth={true}
          closeModal={() => {
            setOpenCloudfrontModal(false);
          }}
          actions={
            <div className="button-action no-pb text-right">
              <Button
                onClick={() => {
                  setOpenCloudfrontModal(false);
                }}
              >
                {t("button.ok")}
              </Button>
            </div>
          }
        >
          <TablePanel
            // loading={loadingData}
            title=""
            selectType={SelectType.NONE}
            actions={<div></div>}
            pagination={<div />}
            items={cloudfrontArnList}
            columnDefinitions={[
              {
                id: "Arn",
                header: t("ssl:jobDetail.cfArn"),
                cell: (e: string) => {
                  return (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://us-east-1.console.aws.amazon.com/cloudfront/v3/home#/distributions/${constructCloudfrontLink(
                        e
                      )}`}
                    >
                      {e}
                    </a>
                    // constructCloudfrontLink(e)
                  );
                },
              },
            ]}
            changeSelected={() => {
              // console.info("select item:", item);
            }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default JobDetail;
