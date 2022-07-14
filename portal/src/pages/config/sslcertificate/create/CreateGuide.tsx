import React from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import HeaderPanel from "components/HeaderPanel";

import CREATE_GUIDE_IMG from "assets/images/config/createGuide.png";
import PagePanel from "components/PagePanel";
import { useNavigate } from "react-router-dom";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Certification List",
    link: "/config/sslcertificate/list",
  },
  {
    name: "Create new certificates",
  },
];

const GUIDE_STEP_LIST = [
  {
    title: "Step1: Request SSL Certificates in ACM",
    subTitle: "Automatic process",
    desc: "With given domain names, request new SSL Certificates via Amazon Certificate Management (ACM) Service. ",
  },
  {
    title: "Step2: Validate Certificates",
    subTitle: "Manual process",
    desc: "The step is also known as Domain Control Validation process (DCV). This step is required by Certificate Authority, (in our case, ACM) to verify you (the person who is requesting the SSL Certificate) is authroized to use the domain names (the CNAMEs). ",
  },
  {
    title: "Step3: Create Distributions (Optional) ",
    subTitle: "Automatic process",
    desc: "Solution will automatically create corresponding CloudFront distributions for you. This is optional.",
  },
];

const CreateGuide: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-1024">
        <PagePanel title="Create new certificates">
          <HeaderPanel title="How it works">
            <div className="create-cert-guide-img">
              <img width="100%" src={CREATE_GUIDE_IMG} />
            </div>
            <div className="flex">
              {GUIDE_STEP_LIST.map((element, index) => {
                return (
                  <div className="flex-1" key={index}>
                    <div className="create-cert-guide-card">
                      <div className="card-header">{element.title}</div>
                      <div className="card-body">
                        <div className="sub-title">{element.subTitle}</div>
                        <div className="desc">{element.desc}</div>
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
                navigate("/config/sslcertificate/create/start");
              }}
            >
              Get Started
            </Button>
          </div>
        </PagePanel>
      </div>
    </div>
  );
};

export default CreateGuide;
