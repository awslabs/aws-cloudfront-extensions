import React from "react";
import ProgressBar from "components/ProgressBar";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";

export enum StatusTypeStep {
  RequestSSLCert = "RequestSSLCert",
  ValidateCert = "ValidateCert",
  CreateCloudFront = "CreateCloudFront",
}

export enum StatusType {
  NOTSTARTED = "NOTSTARTED",
  INPROGRESS = "INPROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  NONEED = "NONEED",
}

const StatusTextMap: any = {
  NOTSTARTED: "Not Started",
  INPROGRESS: "In Progress",
  COMPLETED: "Success",
  FAILED: "Failed",
  NONEED: "Not Needed",
};

const STATUS_LIST_MAP: any = {
  RequestSSLCert: {
    name: "Request SSL Certificates in ACM",
    desc: "With given domain names, request new SSL Certificates via Amazon Certificate Management (ACM) Service. ",
  },
  ValidateCert: {
    name: "Validate Certificates",
    desc: "The step is also known as Domain Control Validation process (DCV). This step is required by Certificate Authority, (in our case, ACM) to verify you (the person who is requesting the SSL Certificate) is authroized to use the domain names (the CNAMEs).",
  },
  CreateCloudFront: {
    name: "Create CloudFront Distributions",
    desc: "If you turn on switch “Automatically Create CloudFront Distribution” in the step1, then the solution will automatically create corresponding CloudFront distributions for you.",
  },
};

interface StatusItemProps {
  stepNo: string;
  step: StatusTypeStep;
  isAuto: boolean;
  status: StatusType;
  progress: number;
  progressTopText: string;
  progressBottomText: string;
}

const StatusItem: React.FC<StatusItemProps> = (props: StatusItemProps) => {
  const {
    stepNo,
    step,
    status,
    isAuto,
    progress,
    progressTopText,
    progressBottomText,
  } = props;
  return (
    <div className="job-status-list-item">
      <div className="job-status-list-item-title">
        Step{stepNo}: {STATUS_LIST_MAP[step].name}
      </div>
      <div className="job-status-list-item-content">
        <div className="job-status-list-item-content-sub-title">
          {isAuto ? "Automatic process" : "Manual process"}
        </div>
        <div className="job-status-list-item-content-desc">
          {STATUS_LIST_MAP[step].desc}
        </div>
        <div
          className={`job-status-list-item-content-status ${status.toLowerCase()}`}
        >
          <div>
            {status === StatusType.COMPLETED && (
              <CheckCircleOutlineIcon fontSize="small" />
            )}
            {status === StatusType.INPROGRESS && (
              <AccessTimeIcon fontSize="small" />
            )}
            {status === StatusType.FAILED && (
              <HighlightOffIcon fontSize="small" />
            )}
            {status === StatusType.NOTSTARTED && (
              <RemoveCircleOutlineIcon fontSize="small" />
            )}
            {status === StatusType.NONEED && (
              <RemoveCircleOutlineIcon fontSize="small" />
            )}
          </div>
          <div className="ml-10 flex-1">
            <div>{StatusTextMap[status]}</div>
            <div className="top-text">{progressTopText}</div>
            <div>
              <div className="progress-bar flex">
                <div className="bar flex-1">
                  <ProgressBar value={progress} />
                </div>
                <div className="number">{progress}%</div>
              </div>
            </div>
            <div className="bottom-text">{progressBottomText}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusItem;
