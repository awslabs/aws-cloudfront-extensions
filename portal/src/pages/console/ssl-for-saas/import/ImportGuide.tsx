import React from "react";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import IMPORT_GUIDE_IMG from "assets/images/config/importGuide.png";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Certification List",
    link: "/config/certification/list",
  },
  {
    name: "Import existing ertificates",
  },
];

const IMPORT_STEP_LIST = [
  {
    name: "Step1: Import SSL Certificates",
    desc: "Import existing SSL Certificates into Amazon Certificate Management (ACM) Service. Please make sure the input SSL Certificate were issued by a public Certificated Autority (CA). ",
  },
  {
    name: "Step2: Automatically Create CloudFront Distributions (Optional) ",
    desc: "If you turn on switch “Automatically Create CloudFront Distribution” in the step1, then the solution will automatically create corresponding CloudFront distributions for you. ",
  },
];

const ImportGuide: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-1024">
        <PagePanel title="Import existing ertificates">
          <HeaderPanel title="How it works">
            <div className="import-cert-guide-img">
              <img width="100%" src={IMPORT_GUIDE_IMG} />
            </div>
            <div className="import-step-list">
              {IMPORT_STEP_LIST.map((element, index) => {
                return (
                  <div key={index} className="import-step-list-item">
                    <div className="item-name">{element.name}</div>
                    <div className="item-desc">{element.desc}</div>
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
              Get Started
            </Button>
          </div>
        </PagePanel>
      </div>
    </div>
  );
};

export default ImportGuide;
