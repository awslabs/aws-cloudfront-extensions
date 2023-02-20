import React from "react";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

const Alarms: React.FC = () => {
  return (
    <div className="gsui-help-container">
      <div className="gsui-help-content">This a a description</div>
      <div className="gsui-help-more">
        <div className="learn-more">
          Learn More
          <i>
            <OpenInNewIcon className="icon" fontSize="small" />
          </i>
        </div>
        <div className="gsui-help-link-item">
          <a href="" target="_blank">
            Info Links
          </a>
        </div>
      </div>
    </div>
  );
};

export default Alarms;
