import React from "react";
import PagePanel from "components/PagePanel";
import Alert from "components/Alert";
import { AlertType } from "components/Alert/alert";
import Button from "components/Button";
import Breadcrumb from "components/Breadcrumb";

const BreadCrumbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Deployment Status",
    link: "/deployment-status",
  },
  {
    name: "Task-01",
  },
];

const DeployResult: React.FC = () => {
  return (
    <div>
      <Breadcrumb list={BreadCrumbList} />
      <PagePanel title="Deploy status">
        <Alert
          actions={
            <div>
              <Button>View deployment status</Button>
            </div>
          }
          type={AlertType.Success}
          title="Your extension are now being deployed"
          content="The extension are being deployed to CloudFront distribution 
          XLOWCQQFJJHM80"
        />
      </PagePanel>
      <PagePanel title="How to use extensions" desc="Form header description">
        <div className="d-status-content ptb-20">Form sections come here.</div>
      </PagePanel>
      <PagePanel title="Here are some helpful resources to get started">
        <div className="m-w-45p">
          <div className="flex">
            <div className="flex-1">
              <a href="/">First link to documentation</a>
            </div>
            <div className="flex-1">
              <a href="/">Second link to documentation</a>
            </div>
          </div>
          <div className="flex">
            <div className="flex-1">
              <a href="/">First link to documentation</a>
            </div>
            <div className="flex-1">
              <a href="/">Second link to documentation</a>
            </div>
          </div>
        </div>
      </PagePanel>
      <div className="mt-20 button-action text-right">
        <Button>View Repository</Button>
      </div>
    </div>
  );
};

export default DeployResult;
