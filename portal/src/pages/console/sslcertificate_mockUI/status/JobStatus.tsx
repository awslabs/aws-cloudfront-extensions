import React, { useEffect } from "react";
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

const JobStatus: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id, status, statusId } = useParams();

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
      name: id || "",
    },
  ];

  useEffect(() => {
    dispatch({ type: ActionType.CLOSE_SIDE_MENU });
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
                  navigate("/config/sslcertificate/list");
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
                    {statusId === "4" ? "68/68" : "10/68"}
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
                    {" "}
                    {statusId === "4" ? "19/19" : "1/19"}
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
            {statusId === "1" && (
              <div className="job-status-list">
                <StatusItem
                  stepNo="1"
                  isAuto
                  step={StatusTypeStep.RequestSSLCert}
                  status={StatusType.InProgress}
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
                  status={StatusType.NotStarted}
                  progress={0}
                  progressTopText="Validate certificate (manual)"
                  progressBottomText="The step will be completed if all SSL certificates were issued"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="3"
                  isAuto
                  step={StatusTypeStep.CreateCloudFront}
                  status={StatusType.NotStarted}
                  progress={0}
                  progressTopText="Create CloudFront distribution"
                  progressBottomText="The step will be completed if all distributions were created"
                />
              </div>
            )}
            {statusId === "2" && (
              <div className="job-status-list">
                <StatusItem
                  stepNo="1"
                  isAuto
                  step={StatusTypeStep.RequestSSLCert}
                  status={StatusType.InProgress}
                  progress={60}
                  progressTopText="Request ACM Certificates"
                  progressBottomText="The step will be completed if all SSL certificates were created"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="2"
                  isAuto
                  step={StatusTypeStep.CreateCloudFront}
                  status={StatusType.NotStarted}
                  progress={0}
                  progressTopText="Create CloudFront distribution"
                  progressBottomText="The step will be completed if all distributions were created"
                />
              </div>
            )}

            {statusId === "3" && (
              <div className="job-status-list">
                <StatusItem
                  stepNo="1"
                  isAuto
                  step={StatusTypeStep.RequestSSLCert}
                  status={StatusType.Success}
                  progress={100}
                  progressTopText=""
                  progressBottomText="All SSL certificates were created"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="2"
                  isAuto={false}
                  step={StatusTypeStep.ValidateCert}
                  status={StatusType.Success}
                  progress={100}
                  progressTopText=""
                  progressBottomText="All SSL certificates were validated"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="3"
                  isAuto
                  step={StatusTypeStep.CreateCloudFront}
                  status={StatusType.Failed}
                  progress={30}
                  progressTopText=""
                  progressBottomText="Error：InvalidInputException
                  Message: Duplicated CNAME: “mihoyo.gameserver.com"
                />
              </div>
            )}

            {statusId === "4" && (
              <div className="job-status-list">
                <StatusItem
                  stepNo="1"
                  isAuto
                  step={StatusTypeStep.RequestSSLCert}
                  status={StatusType.Success}
                  progress={100}
                  progressTopText=""
                  progressBottomText="All SSL certificates were created"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="2"
                  isAuto={false}
                  step={StatusTypeStep.ValidateCert}
                  status={StatusType.Success}
                  progress={100}
                  progressTopText=""
                  progressBottomText="All SSL certificates were validated"
                />
                <div>
                  <img className="ml-80 arrow-width" src={ArrowDown} />
                </div>
                <StatusItem
                  stepNo="3"
                  isAuto
                  step={StatusTypeStep.CreateCloudFront}
                  status={StatusType.Success}
                  progress={100}
                  progressTopText=""
                  progressBottomText="All CloudFront Distribution were created"
                />
              </div>
            )}
          </div>
        </HeaderPanel>
      </div>
    </div>
  );
};

export default JobStatus;
