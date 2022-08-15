import React from "react";
import PagePanel from "components/PagePanel";
import Alert from "components/Alert";
import { AlertType } from "components/Alert/alert";
import Button from "components/Button";
import { DeployExtensionObj } from "./Deploy";
import { useSelector } from "react-redux";
import { AmplifyConfigType } from "assets/js/type";
import { AppStateProps } from "reducer/appReducer";
import { useTranslation } from "react-i18next";

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

  const { t } = useTranslation();

  return (
    <div>
      {/* <Breadcrumb list={BreadCrumbList} /> */}
      <PagePanel title={t("repository:result.status")}>
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
                <Button>{t("button.viewStatus")}</Button>
              </a>
            </div>
          }
          type={AlertType.Success}
          title={t("repository:result.notDeployed")}
          content={
            deployExtensionObj.distributionObj
              ? `${t("repository:result.beingDeploy")}
          ${deployExtensionObj.distributionObj?.value}`
              : ""
          }
        />
      </PagePanel>
      <PagePanel
        title={t("repository:result.howToUse")}
        desc={deployExtensionObj.desc}
      >
        <div className="d-status-content ptb-20">
          {t("repository:result.fromHere")}
        </div>
      </PagePanel>
      <PagePanel title={t("repository:result.helpful")}>
        <div className="m-w-45p">
          <div className="flex">
            <div className="flex-1">
              <a href="/">{t("repository:result.firstLink")}</a>
            </div>
            <div className="flex-1">
              <a href="/">{t("repository:result.secondLink")}</a>
            </div>
          </div>
          <div className="flex">
            <div className="flex-1">
              <a href="/">{t("repository:result.firstLink")}</a>
            </div>
            <div className="flex-1">
              <a href="/">{t("repository:result.secondLink")}</a>
            </div>
          </div>
        </div>
      </PagePanel>
      <div className="mt-20 button-action text-right">
        <a href={deployExtensionObj.codeUri} target="_blank" rel="noreferrer">
          <Button>{t("button.viewRepo")}</Button>
        </a>
      </div>
    </div>
  );
};

export default DeployResult;
