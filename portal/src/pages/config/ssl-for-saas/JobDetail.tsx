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
import StatusItem, { StatusType, StatusTypeStep } from "./StatusItem";
import { appSyncRequestQuery } from "../../../assets/js/request";
import { getJobInfo } from "../../../graphql/queries";
import { SSLJob } from "../../../API";

const JobDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jobId } = useParams();
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
  });
  const [loadingData, setLoadingData] = useState(false);

  const BreadCrunbList = [
    {
      name: "CloudFront Extensions",
      link: "/",
    },
    {
      name: "Certification Jobs",
      link: "/config/jobs/list",
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
      setLoadingData(true);
      const resData = await appSyncRequestQuery(getJobInfo, {
        jobId: jobId,
      });
      const jobInfo: SSLJob = resData.data.getJobInfo;
      setJobInfo(jobInfo);
      console.info(jobInfo);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchJobInfo();
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="pb-50">
        <HeaderPanel
          title="Job overview"
          desc="Viewing data from N.Virginia region"
          action={
            <div>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/list");
                }}
              >
                Back to Certificate List
              </Button>
              <Button
                className="ml-10"
                btnType="primary"
                onClick={() => {
                  navigate("/config/jobs/list");
                }}
              >
                Back to Certificate Jobs
              </Button>
            </div>
          }
        >
          <div className="flex value-label-span">
            <div>
              <ValueWithLabel label="Overall Job Status">
                <div className={status?.toLocaleLowerCase()}>{status}</div>
              </ValueWithLabel>
            </div>
            <div className="flex-1 border-left-c">
              <ValueWithLabel label="Current / Expected Certificates	">
                <div className="flex">
                  <div className="job-status-number">
                    {jobInfo.cert_completed_number +
                      "/" +
                      jobInfo.cert_total_number}
                  </div>
                  <div className="flex-1">
                    <Button>
                      View SSL certificates created in this job
                      <span>
                        <OpenInNewIcon />
                      </span>
                    </Button>
                  </div>
                </div>
              </ValueWithLabel>
            </div>
            <div className="flex-1 border-left-c">
              <ValueWithLabel label="Current / Expected CloudFront Distribution">
                <div className="flex">
                  <div className="job-status-number">
                    {jobInfo.cloudfront_distribution_created_number +
                      "/" +
                      jobInfo.cloudfront_distribution_total_number}
                  </div>
                  <div className="flex-1">
                    <Button>
                      View distributions created in this job
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
          title="Job Status"
          action={
            <div>
              <Button btnType="text">More resources</Button>
            </div>
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
                  progress={60}
                  progressTopText="Request ACM Certificates"
                  progressBottomText="The step will be completed if all SSL certificates were created"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="2"
                  isAuto={false}
                  step={StatusTypeStep.ValidateCert}
                  status={jobInfo.certValidationStageStatus}
                  progress={0}
                  progressTopText="Walidate certificate (manual)"
                  progressBottomText="The step will be completed if all SSL certificates were issued"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="3"
                  isAuto
                  step={StatusTypeStep.CreateCloudFront}
                  status={jobInfo.distStageStatus}
                  progress={0}
                  progressTopText="Create CloudFront distribution"
                  progressBottomText="The step will be completed if all distributions were created"
                />
              </div>
            }
          </div>
        </HeaderPanel>
      </div>
    </div>
  );
};

export default JobDetail;
