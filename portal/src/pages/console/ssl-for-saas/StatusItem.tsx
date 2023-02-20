import React from "react";
import ProgressBar from "components/ProgressBar";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import { useTranslation } from "react-i18next";

export enum StatusTypeStep {
  RequestSSLCert = "RequestSSLCert",
  ValidateCert = "ValidateCert",
  CreateCloudFront = "CreateCloudFront",
}

export enum StatusType {
  NOTSTART = "NOTSTART",
  INPROGRESS = "INPROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  NONEED = "NONEED",
}

const StatusTextMap: any = {
  NOTSTART: "ssl:status.notStartd",
  INPROGRESS: "ssl:status.inProgress",
  COMPLETED: "ssl:status.success",
  FAILED: "ssl:status.failed",
  NONEED: "ssl:status.noneed",
};

const STATUS_LIST_MAP: any = {
  RequestSSLCert: {
    name: "ssl:status.requestName",
    desc: "ssl:status.requestDesc",
  },
  ValidateCert: {
    name: "ssl:status.validName",
    desc: "ssl:status.validDesc",
  },
  CreateCloudFront: {
    name: "ssl:status.createName",
    desc: "ssl:status.createDesc",
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
  const { t } = useTranslation();
  return (
    <div className="job-status-list-item">
      <div className="job-status-list-item-title">
        {t("ssl:status.step")}
        {stepNo}: {t(STATUS_LIST_MAP[step].name)}
      </div>
      <div className="job-status-list-item-content">
        <div className="job-status-list-item-content-sub-title">
          {isAuto ? "Automatic process" : "Manual process"}
        </div>
        <div className="job-status-list-item-content-desc">
          {t(STATUS_LIST_MAP[step].desc)}
        </div>
        <div
          className={`job-status-list-item-content-status ${status?.toLowerCase()}`}
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
            {status === StatusType.NOTSTART && (
              <RemoveCircleOutlineIcon fontSize="small" />
            )}
            {status === StatusType.NONEED && (
              <RemoveCircleOutlineIcon fontSize="small" />
            )}
          </div>
          <div className="ml-10 flex-1">
            <div>{t(StatusTextMap[status])}</div>
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
