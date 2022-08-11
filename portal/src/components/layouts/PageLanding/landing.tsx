import React from "react";
import Button from "components/Button";
import HeaderPanel from "components/HeaderPanel";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface TitleDescType {
  title: string;
  desc?: string;
  link?: string;
}

interface HomeProps {
  solutionTag: string;
  headTitle: string;
  headSubTitle: string;
  headDesc: string;
  getStartedDesc: string;
  getStartedLink: string;
  benefitList: TitleDescType[];
  useCaseList: TitleDescType[];
  getStartList: TitleDescType[];
  moreResourceList: TitleDescType[];
}

const PageLanding: React.FC<HomeProps> = (props: HomeProps) => {
  const {
    solutionTag,
    headTitle,
    headSubTitle,
    headDesc,
    getStartedDesc,
    getStartedLink,
    benefitList,
    useCaseList,
    getStartList,
    moreResourceList,
  } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      <div className="home-header">
        <div className="home-header-content">
          <div className="home-header-tc">
            <div className="small-title">{solutionTag}</div>
            <div className="main-title">{headTitle}</div>
            <div className="main-desc">{headSubTitle}</div>
            <div className="small-desc">{headDesc}</div>
          </div>
        </div>
      </div>
      <div className="home-content">
        <div className="home-content-left">
          <div className="home-box-title">{t("home:benifits.title")}</div>
          <div className="home-box">
            {benefitList.map((element, index) => {
              return (
                <div className="box-item" key={index}>
                  <div className="sub-title">{t(element.title)}</div>
                  <div>{t(element.desc || "")}</div>
                </div>
              );
            })}
          </div>

          <div className="home-box-title">{t("home:usecase.title")}</div>
          <div className="home-box">
            {useCaseList.map((element, index) => {
              return (
                <div className="box-item" key={index}>
                  <div className="sub-title">{t(element.title)}</div>
                  <div>{t(element.desc || "")}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="home-content-right">
          <div className="get-start-box">
            <div className="start-title">{t("home:getStarted.title")}</div>
            <div className="mt-10">{getStartedDesc}</div>
            <div className="mt-20">
              <Button
                btnType="primary"
                onClick={() => {
                  navigate(getStartedLink);
                }}
              >
                {t("button.getStarted")}
              </Button>
            </div>
          </div>

          <div>
            <HeaderPanel
              contentNoPadding
              title={t("home:gettingStarted.title")}
            >
              <ul className="home-link-ul">
                {getStartList.map((element, index) => {
                  return (
                    <li key={index}>
                      <a href={element.link}>{t(element.title)}</a>
                    </li>
                  );
                })}
              </ul>
            </HeaderPanel>
          </div>

          <div>
            <HeaderPanel contentNoPadding title={t("home:moreResource.title")}>
              <ul className="home-link-ul">
                {moreResourceList.map((element, index) => {
                  return (
                    <li key={index}>
                      <a href={element.link}>{t(element.title)}</a>
                    </li>
                  );
                })}
              </ul>
            </HeaderPanel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLanding;
