import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import CreateStep from "components/CreateStep";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import ConfigCertificate from "./steps/ConfigCertificate";
import Review from "./steps/Review";
import AddCName from "./steps/AddCName";

const BreadCrumbList = [
  { name: "CloudFront Extensions", link: "/" },
  { name: "Certification settings" },
];

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
              { name: "Add CName" },
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
          {activeStep === 0 && <AddCName />}
          {activeStep === 1 && <ConfigCertificate />}
          {activeStep === 2 && <Review />}
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
            {activeStep < 2 && (
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
            {activeStep === 2 && (
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
