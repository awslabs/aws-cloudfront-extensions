import PageLanding from "components/layouts/PageLanding";
import React from "react";
import { useTranslation } from "react-i18next";

const BENEFIT_LIST = [
  {
    title: "home:benifits.beft1",
    desc: "home:benifits.beft1Desc",
  },
  {
    title: "home:benifits.beft2",
    desc: "home:benifits.beft2Desc",
  },
  {
    title: "home:benifits.beft3",
    desc: "home:benifits.beft3Desc",
  },
  {
    title: "home:benifits.beft4",
    desc: "home:benifits.beft4Desc",
  },
];

const USECASE_LIST = [
  {
    title: "home:usecase.usecase1",
    desc: "home:usecase.usecase1Desc",
  },
  {
    title: "home:usecase.usecase2",
    desc: "home:usecase.usecase2Desc",
  },
];

const GETTING_START_LIST = [
  {
    title: "home:gettingStarted.startCF",
    link: "https://awslabs.github.io/aws-cloudfront-extensions/",
  },
];

const MORE_RESOURCE_LIST = [
  // {
  //   title: "home:moreResource.doc",
  //   link: "https://awslabs.github.io/aws-cloudfront-extensions/",
  // },
  // {
  //   title: "home:moreResource.faq",
  //   link: "/",
  // },
  {
    title: "home:moreResource.issue",
    link: "https://github.com/awslabs/aws-cloudfront-extensions/issues",
  },
  // {
  //   title: "home:moreResource.workshop",
  //   link: "/",
  // },
];

const Home: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <PageLanding
        solutionTag={t("home:category")}
        headTitle={t("home:title")}
        headSubTitle={t("home:subTitle")}
        headDesc={t("home:desc")}
        getStartedDesc={t("home:getStarted.desc")}
        getStartedLink="/extentions-repository"
        benefitList={BENEFIT_LIST}
        useCaseList={USECASE_LIST}
        getStartList={GETTING_START_LIST}
        moreResourceList={MORE_RESOURCE_LIST}
      />
    </div>
  );
};

export default Home;
