import React from "react";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
// import NotInterestedIcon from "@material-ui/icons/NotInterested";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";

export enum StatusType {
  create_complele = "create_complele",
  Enabled = "Enabled",
  Success = "Success",
  Deployed = "Deployed",
  Disabled = "Disabled",
  Unknown = "Unknown",
  Active = "Active",
  Creating = "Creating",
  InProgress = "InProgress",
  Inactive = "Inactive",
  NotStarted = "NotStarted",
  Error = "Error",
  Failed = "Failed",
  Green = "Green",
  Red = "Red",
  Yellow = "Yellow",
  Deleting = "Deleting",
  Online = "Online",
  Offline = "Offline",
  Installing = "Installing",
}

interface StatusProps {
  status: string;
}

const Status: React.FC<StatusProps> = (props: StatusProps) => {
  // console.info("props:", props);
  const { status } = props;
  return (
    <div className="inline-block gsui-status">
      <span className={"status-text " + status.toLocaleLowerCase()}>
        {status.toLocaleUpperCase() ===
          StatusType.Green.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Success.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Deployed.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Active.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Online.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Enabled.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.create_complele.toLocaleUpperCase() && (
          <i>
            <CheckCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Creating.toLocaleUpperCase() && (
          <i>
            <AccessTimeIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Installing.toLocaleUpperCase() && (
          <i>
            <AccessTimeIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.InProgress.toLocaleUpperCase() && (
          <i>
            <AccessTimeIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Inactive.toLocaleUpperCase() && (
          <i>
            <RemoveCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Deleting.toLocaleUpperCase() && (
          <i>
            <RemoveCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Unknown.toLocaleUpperCase() && (
          <i>
            <RemoveCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.NotStarted.toLocaleUpperCase() && (
          <i>
            <RemoveCircleOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Yellow.toLocaleUpperCase() && (
          <i>
            <ErrorOutlineIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Offline.toLocaleUpperCase() && (
          <i>
            <HighlightOffIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Failed.toLocaleUpperCase() && (
          <i>
            <HighlightOffIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Error.toLocaleUpperCase() && (
          <i>
            <HighlightOffIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() === StatusType.Red.toLocaleUpperCase() && (
          <i>
            <HighlightOffIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleUpperCase() ===
          StatusType.Disabled.toLocaleUpperCase() && (
          <i>
            <HighlightOffIcon fontSize="small" />
          </i>
        )}
        {status.toLocaleLowerCase()}
      </span>
    </div>
  );
};

export default Status;
