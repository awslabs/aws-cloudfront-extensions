import React from "react";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import IMPORT_GUIDE_IMG from "assets/images/config/importGuide.png";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const IMPORT_STEP_LIST = [
  {
    name: "ssl:guide.import.step1",
    desc: "ssl:guide.import.step1Desc",
  },
  {
    name: "ssl:guide.import.step2",
    desc: "ssl:guide.import.step2Desc",
  },
];

const ImportGuide: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("ssl:sslList"),
      link: "/config/certification/list",
    },
    {
      name: t("ssl:importExist"),
    },
  ];
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-1024">
        <PagePanel title={t("ssl:importExist")}>
          <HeaderPanel title={t("ssl:guide.howItWorks")}>
            <div className="import-cert-guide-img">
              <img width="100%" src={IMPORT_GUIDE_IMG} />
            </div>
            <div className="import-step-list">
              {IMPORT_STEP_LIST.map((element, index) => {
                return (
                  <div key={index} className="import-step-list-item">
                    <div className="item-name">{t(element.name)}</div>
                    <div className="item-desc">{t(element.desc)}</div>
                  </div>
                );
              })}
            </div>
          </HeaderPanel>
          <div className="button-action text-right">
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/certification/import/start");
              }}
            >
              {t("button.getStarted")}
            </Button>
          </div>
        </PagePanel>
      </div>
    </div>
  );
};

export default ImportGuide;
