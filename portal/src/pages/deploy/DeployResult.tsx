import React from "react";
import PagePanel from "components/PagePanel";
import Alert from "components/Alert";
import { AlertType } from "components/Alert/alert";
import Button from "components/Button";
import { DeployExtensionObj } from "./Deploy";
import { useSelector } from "react-redux";
import { AmplifyConfigType } from "assets/js/type";
import { AppStateProps } from "reducer/appReducer";

interface DeployResultProps {
  stackLink: string;
  deployExtensionObj: DeployExtensionObj;
}

const DeployResult: React.FC<DeployResultProps> = (
  props: DeployResultProps
) => {
  const queryParams = new URLSearchParams(window.location.search);
  const urlStackLink = queryParams.get("stackLink");
  const { stackLink, deployExtensionObj } = props;
  // const [searchParams, setSearchParams] = useSearchParams();

  const amplifyConfig: AmplifyConfigType = useSelector(
    (state: AppStateProps) => state.amplifyConfig
  );

  return (
    <div>
      {/* <Breadcrumb list={BreadCrumbList} /> */}
      <PagePanel title="Deploy status">
        <Alert
          actions={
            <div>
              <a
                href={`https://${
                  amplifyConfig.aws_project_region
                }.console.aws.amazon.com/cloudformation/home?region=${
                  amplifyConfig.aws_project_region
                }#/stacks/stackinfo?filteringStatus=active&filteringText=&viewNested=true&hideStacks=false&stackId=${
                  urlStackLink || stackLink
                }`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>View deployment status</Button>
              </a>
            </div>
          }
          type={AlertType.Success}
          title="Your extension are now being deployed"
          content={
            deployExtensionObj.distributionObj
              ? `The extension are being deployed to CloudFront distribution 
          ${deployExtensionObj.distributionObj?.value}`
              : ""
          }
        />
      </PagePanel>
      <PagePanel title="How to use extensions" desc={deployExtensionObj.desc}>
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
        <a href={deployExtensionObj.codeUri} target="_blank" rel="noreferrer">
          <Button>View Repository</Button>
        </a>
      </div>
    </div>
  );
};

export default DeployResult;
