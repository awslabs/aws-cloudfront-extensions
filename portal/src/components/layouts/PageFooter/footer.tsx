import React, { useState } from "react";

import LanguageIcon from "@material-ui/icons/Language";
import FeedbackIcon from "@material-ui/icons/Feedback";

const langList = [
  {
    id: "en",
    name: "English",
  },
  {
    id: "zh",
    name: "中文(简体)",
  },
];

const Bottom: React.FC = () => {
  const [showLang, setShowLang] = useState(false);
  const toggleShowLang = () => {
    setShowLang(!showLang);
  };

  return (
    <footer className="gsui-footer">
      <div className="page-bottom">
        <a rel="noopener noreferrer" href="/" target="_blank">
          <div className="item feedback">
            <FeedbackIcon className="bottom-icon" fontSize="small" />
            Feedback
          </div>
        </a>
        <div className="item language">
          {showLang ? (
            <div className="language-select">
              <ul>
                {langList.map((item, index) => {
                  return <li key={index}>{item.name}</li>;
                })}
              </ul>
            </div>
          ) : (
            ""
          )}
          <span onClick={toggleShowLang}>
            <LanguageIcon className="bottom-icon" fontSize="small" />{" "}
            <span>English</span>
          </span>
        </div>

        <span className="privacy">Terms of Use</span>
        <span className="privacy">Privacy Policy</span>
        <span className="notice">
          {`© 2008 -${new Date().getFullYear()}, `}
          Amazon Web Services, Inc. or its affiliates. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Bottom;
