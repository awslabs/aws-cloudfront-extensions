import React from "react";
import Button from "components/Button";
import HeaderPanel from "components/HeaderPanel";
import { useNavigate } from "react-router-dom";

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
          <div className="home-box-title">Benefits and features</div>
          <div className="home-box">
            {benefitList.map((element, index) => {
              return (
                <div className="box-item" key={index}>
                  <div className="sub-title">{element.title}</div>
                  <div>{element.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="home-box-title">Use cases</div>
          <div className="home-box">
            {useCaseList.map((element, index) => {
              return (
                <div className="box-item" key={index}>
                  <div className="sub-title">{element.title}</div>
                  <div>{element.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="home-content-right">
          <div className="get-start-box">
            <div className="start-title">Get started</div>
            <div className="mt-10">{getStartedDesc}</div>
            <div className="mt-20">
              <Button
                btnType="primary"
                onClick={() => {
                  navigate(getStartedLink);
                }}
              >
                Get Started
              </Button>
            </div>
          </div>

          <div>
            <HeaderPanel contentNoPadding title="Getting Started">
              <ul className="home-link-ul">
                {getStartList.map((element, index) => {
                  return (
                    <li key={index}>
                      <a href={element.link}>{element.title}</a>
                    </li>
                  );
                })}
              </ul>
            </HeaderPanel>
          </div>

          <div>
            <HeaderPanel contentNoPadding title="More resources">
              <ul className="home-link-ul">
                {moreResourceList.map((element, index) => {
                  return (
                    <li key={index}>
                      <a href={element.link}>{element.title}</a>
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
