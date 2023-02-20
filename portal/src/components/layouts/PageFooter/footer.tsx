import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import LanguageIcon from "@material-ui/icons/Language";
import FeedbackIcon from "@material-ui/icons/Feedback";
import {
  EN_LANGUAGE_LIST,
  URL_FEEDBACK,
  ZH_LANGUAGE_LIST,
} from "assets/js/const";

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

const getCurrentLangObj = (id: string) => {
  let defaultItem = null;
  langList.forEach((item) => {
    if (id === item.id) {
      defaultItem = item;
    }
  });
  return defaultItem ? defaultItem : langList[0];
};

const Bottom: React.FC = () => {
  const { t, i18n } = useTranslation();

  if (EN_LANGUAGE_LIST.indexOf(i18n.language) >= 0) {
    i18n.language = "en";
  }
  if (ZH_LANGUAGE_LIST.indexOf(i18n.language) >= 0) {
    i18n.language = "zh";
  }
  const initLang = getCurrentLangObj(i18n.language);
  const [currentLang, setCurrentLang] = useState(initLang);

  const changeSelectLang: any = (event: any) => {
    const newLang = JSON.parse(event.target.getAttribute("data-lang"));
    setCurrentLang(newLang);
    i18n.changeLanguage(newLang.id);
    setShowLang(false);
  };

  const [showLang, setShowLang] = useState(false);
  const toggleShowLang = () => {
    setShowLang(!showLang);
  };

  return (
    <footer className="gsui-footer">
      <div className="page-bottom">
        <a rel="noopener noreferrer" href={URL_FEEDBACK} target="_blank">
          <div className="item feedback">
            <FeedbackIcon className="bottom-icon" fontSize="small" />
            {t("bottom.feedback")}
          </div>
        </a>
        <div className="item language">
          {showLang ? (
            <div className="language-select">
              <ul>
                {langList.map((item: any, index) => {
                  return (
                    <li
                      key={index}
                      data-lang={JSON.stringify(item)}
                      onClick={changeSelectLang}
                    >
                      {item.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            ""
          )}
          <span onClick={toggleShowLang}>
            <LanguageIcon className="bottom-icon" fontSize="small" />{" "}
            <span>{currentLang.name}</span>
          </span>
        </div>

        {/* <span className="privacy">{t("bottom.use")}</span>
      <span className="privacy">{t("bottom.privacy")}</span> */}

        <span className="notice">
          {`© 2008 -${new Date().getFullYear()}, `}
          {t("bottom.copy")}
        </span>
      </div>
    </footer>
  );
};

export default Bottom;
