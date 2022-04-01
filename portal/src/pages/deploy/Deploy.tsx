import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import CreateStep from "components/CreateStep";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChooseCloudFront from "./steps/ChooseCloudFront";
import FunctionAssociations from "./steps/FunctionAssociations";
import Review from "./steps/Review";

const BreadCrumbList = [
  { name: "CloudFront Extensions", link: "/" },
  { name: "Deploy" },
];

const Deploy: React.FC = () => {
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
              { name: "Choose CloudFront distribution" },
              { name: "Function associations" },
              { name: "Review" },
            ]}
            selectStep={(step) => {
              console.info("step:", step);
              setActiveStep(step);
            }}
          />
        </div>
        <div className="create-content m-w-800">
          {activeStep === 0 && <ChooseCloudFront />}
          {activeStep === 1 && <FunctionAssociations />}
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
                  navigate("/deployment-status/detail/XLOWCQQFJJHM80");
                }}
              >
                Deploy
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deploy;
