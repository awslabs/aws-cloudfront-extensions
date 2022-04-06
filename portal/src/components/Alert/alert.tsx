import React, { ReactElement } from "react";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import ReportProblemOutlinedIcon from "@material-ui/icons/ReportProblemOutlined";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";

export enum AlertType {
  Success = "Success",
  Normal = "Normal",
  Error = "Error",
}
interface AlertProps {
  type?: AlertType;
  title?: string;
  content: string | JSX.Element;
  actions?: ReactElement;
}

const Alert: React.FC<AlertProps> = (props: AlertProps) => {
  const { type, title, content, actions } = props;
  return (
    <div className={`gsui-alert-wrap ${type?.toLowerCase()}`}>
      <div className="icon">
        {type === AlertType.Error && (
          <ReportProblemOutlinedIcon className="error-text" fontSize="small" />
        )}
        {type === AlertType.Success && (
          <CheckCircleOutlineIcon className="success-text" />
        )}
        {(!type || type === AlertType.Normal) && (
          <ErrorOutlineIcon className="reverse" />
        )}
      </div>
      <div className="text">
        {actions ? (
          <div className="space-between">
            <div className="text-title">{title}</div>
            <div className="actions">{actions}</div>
          </div>
        ) : (
          title && <div className="text-title">{title}</div>
        )}
        <div className="text-content">{content}</div>
      </div>
    </div>
  );
};

export default Alert;
