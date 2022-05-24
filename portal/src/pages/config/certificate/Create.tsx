import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import CreateStep from "components/CreateStep";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import ConfigCertificate from "./steps/ConfigCertificate";
import Review from "./steps/Review";
import AddCName from "./steps/AddCName";
import { OptionType } from "../../../components/AutoComplete/autoComplete";
import { ParamsType } from "../../deploy/Deploy";

const BreadCrumbList = [
  { name: "CloudFront Extensions", link: "/extentions-repository" },
  { name: "Certification settings" },
];

export interface ExistingCfInfo {
  distribution_id: string;
  config_version_id: string;
}
export interface CNameInfo {
  domainName: string;
  sanList: string[];
  originsItemsDomainName: string;
  existing_cf_info: ExistingCfInfo;
}

export interface PemInfo {
  CertPem: string;
  PrivateKeyPem: string;
  ChainPem: string;
  originsItemsDomainName: string;
}

export interface CertImportCreateObj {
  acm_op: string;
  auto_creation: string;
  dist_aggregate: string;
  enable_cname_check: string;
  cnameList: CNameInfo[];
  pemList: PemInfo[];
}

const CreateCertificate: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div>
      <Breadcrumb list={BreadCrumbList} />
      <div className="gsui-create-wrapper">
        <div className="create-step">
          <CreateStep
            activeIndex={activeStep}
            list={[
              // { name: "Add CName" },
              { name: "Create certification" },
              { name: "Review" },
            ]}
            selectStep={(step) => {
              console.info("step:", step);
              setActiveStep(step);
            }}
          />
        </div>
        <div className="create-content m-w-800">
          {/*{activeStep === 0 && <AddCName />}*/}
          {activeStep === 0 && <ConfigCertificate />}
          {activeStep === 1 && <Review />}
          <div className="button-action text-right">
            <Button>Cancel</Button>
            {activeStep > 0 && (
              <Button
                onClick={() => {
                  setActiveStep((prev) => {
                    return prev - 1;
                  });
                }}
              >
                Previous
              </Button>
            )}
            {activeStep < 1 && (
              <Button
                btnType="primary"
                onClick={() => {
                  setActiveStep((prev) => {
                    return prev + 1;
                  });
                }}
              >
                Next
              </Button>
            )}
            {activeStep === 1 && (
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/list");
                }}
              >
                Create
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCertificate;
