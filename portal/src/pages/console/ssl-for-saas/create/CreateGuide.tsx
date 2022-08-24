import React from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import HeaderPanel from "components/HeaderPanel";

import CREATE_GUIDE_IMG from "assets/images/config/createGuide.png";
import PagePanel from "components/PagePanel";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const GUIDE_STEP_LIST = [
  {
    title: "ssl:guide.create.step1",
    subTitle: "ssl:guide.create.step1Title",
    desc: "ssl:guide.create.step1Desc",
  },
  {
    title: "ssl:guide.create.step2",
    subTitle: "ssl:guide.create.step2Title",
    desc: "ssl:guide.create.step2Desc",
  },
  {
    title: "ssl:guide.create.step3",
    subTitle: "ssl:guide.create.step3Title",
    desc: "ssl:guide.create.step3Desc",
  },
];

const CreateGuide: React.FC = () => {
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
      name: t("ssl:createNew"),
    },
  ];
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-1024">
        <PagePanel title={t("ssl:createNew")}>
          <HeaderPanel title={t("ssl:guide.howItWorks")}>
            <div className="create-cert-guide-img">
              <img width="100%" src={CREATE_GUIDE_IMG} />
            </div>
            <div className="flex">
              {GUIDE_STEP_LIST.map((element, index) => {
                return (
                  <div className="flex-1" key={index}>
                    <div className="create-cert-guide-card">
                      <div className="card-header">{t(element.title)}</div>
                      <div className="card-body">
                        <div className="sub-title">{t(element.subTitle)}</div>
                        <div className="desc">{t(element.desc)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </HeaderPanel>
          <div className="button-action text-right">
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/certification/create/start");
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

export default CreateGuide;
