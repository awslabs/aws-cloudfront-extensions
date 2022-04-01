import PageLanding from "components/layouts/PageLanding";
import React from "react";

const BENEFIT_LIST = [
  {
    title: "CloudFront best practices",
    desc: "You can find the code implementation of most common Amazon CloudFront use cases. All solutions and applications included are vetted by Amazon Web Services.",
  },
  {
    title: "Easy one-click deployment",
    desc: "You can easily deploy CloudFront applications or solutions into your Amazon Web Services console with just 1-click.",
  },
  {
    title: "Open Source & Customization",
    desc: "Amazon CloudFront Extensions is an open-source project. You can use the solutions and applications for free. If you have different use cases, you can take the source code as reference to make your own implementation.",
  },
  {
    title: "Reference for various scenario",
    desc: "Amazon CloudFront Extensions includes a rich ret of extensions which cover various use cases.",
  },
];

const USECASE_LIST = [
  {
    title: "eCommerce Website",
    desc: "This solution provides a template for using WAF and Shield Advanced on CloudFront, it will automatically deploy a set of WAF rules and Shield protection groups into your AWS account to secure your web application against DDoS attack, badbot, SQL injection attack, XSS attack and block the IP which has bad reputation.",
  },
  {
    title: "Resize image on the fly",
    desc: "Resize pictures on the fly according to dimensions passed by the query parameter.",
  },
];

const GETTING_START_LIST = [
  {
    title: "Getting started with CloudFront Extensions",
    link: "/",
  },
  {
    title: "Getting started with CloudFront Extensions",
    link: "/",
  },
];

const MORE_RESOURCE_LIST = [
  {
    title: "Documentation",
    link: "/",
  },
  {
    title: "FAQ",
    link: "/",
  },
  {
    title: "Submit issues",
    link: "/",
  },
  {
    title: "Workshop",
    link: "/",
  },
];

const Home: React.FC = () => {
  return (
    <div>
      <PageLanding
        solutionTag="Networking &amp; Content Delivery"
        headTitle="CloudFront Extensions"
        headSubTitle="Use Amazon CloudFront conveniently in different scenarios"
        headDesc="CloudFront Extensions includes rich set of featured Lambda@Edge, CloudFront Functions, CDK templates for various user scenarios and an out-of-box monitoring solution."
        getStartedDesc="Find common extensions for your CloudFront"
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
