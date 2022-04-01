import React from "react";
import { useSelector, useDispatch } from "react-redux";
import CloseIcon from "@material-ui/icons/Close";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import { ActionType, AppStateProps, InfoBarTypes } from "reducer/appReducer";
import Alarms from "help/Alarms";

interface HelpPanelProps {
  className?: string;
}

export const HelpPanel: React.FC<HelpPanelProps> = (props: HelpPanelProps) => {
  const { className } = props;
  const { showInfoBar, infoBarType } = useSelector(
    (state: AppStateProps) => state
  );
  const dispatch = useDispatch();

  return (
    <div
      className={`${className} lh-helper`}
      style={{ marginRight: showInfoBar ? undefined : -240 }}
    >
      <div className="gsui-help-panel-title">
        {!showInfoBar && (
          <div
            className="collapse-menu"
            onClick={() => {
              // setIsOpen(true);
            }}
          >
            <ErrorOutlineIcon className="reverse menu-icon" />
          </div>
        )}
        {showInfoBar && (
          <div className="flex-1">
            <div>
              <CloseIcon
                onClick={() => {
                  dispatch({ type: ActionType.CLOSE_INFO_BAR });
                }}
                className="close-icon"
              />
              <div className="head-title">Info Title</div>
            </div>
          </div>
        )}
      </div>
      {showInfoBar && (
        <div>{infoBarType === InfoBarTypes.ALARMS && <Alarms />}</div>
      )}
    </div>
  );
};

HelpPanel.defaultProps = {
  className: "",
};

export default HelpPanel;
