import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import CreateStep from "components/CreateStep";
import { useNavigate, useParams } from "react-router-dom";
import ChooseCloudFront from "./steps/ChooseCloudFront";
import FunctionAssociations from "./steps/FunctionAssociations";
import Review from "./steps/Review";
import { appSyncRequestMutation, appSyncRequestQuery } from "assets/js/request";
import { deployExtension } from "graphql/mutations";
import { queryByName } from "graphql/queries";
import LoadingText from "components/LoadingText";
import { ExtensionType } from "API";
import { OptionType } from "components/AutoComplete/autoComplete";
import DeployResult from "./DeployResult";
import { useTranslation } from "react-i18next";

export type ParameterType = {
  parameterKey: string;
  parameterValue: string | undefined | string[];
};

export interface ParamsType {
  key: string;
  desc: string;
  type: string;
  value: string;
  isEmpty: boolean;
}
export interface DeployExtensionObj {
  name: string;
  type: string;
  stage: string;
  codeUri: string;
  desc: string;
  distributionObj: OptionType | null;
  behaviorArr: string[];
  paramList: ParamsType[];
  // commonParams: ParameterType[];
  // parameters: ParameterType[];
}

export interface DeployValidationErrorObj {
  distributionEmpty: boolean;
  behaviorEmpty: boolean;
}

const Deploy: React.FC = () => {
  const { extName, status } = useParams();
  const navigate = useNavigate();
  const [isDeployed, setIsDeployed] = useState(
    status === "success" ? true : false
  );
  const [loadingData, setLoadingData] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loadingDeploy, setLoadingDeploy] = useState(false);
  const [deployExtensionObj, setdeployExtensionObj] =
    useState<DeployExtensionObj>({
      name: extName || "",
      type: "",
      stage: "",
      codeUri: "",
      desc: "",
      distributionObj: null,
      behaviorArr: [],
      paramList: [],
      // parameters: [],
    });
  const [stackLink, setStackLink] = useState("");

  const [deployValidationError, setDeployValidationError] = useState({
    distributionEmpty: false,
    behaviorEmpty: false,
  });

  const { t } = useTranslation();
  const BreadCrumbList = [
    { name: t("menu.cfext"), link: "/extentions-repository" },
    { name: t("menu.deploy") },
  ];

  // Check User Deploy Input
  const checkUserDeployInputValidation = () => {
    let validRes = true;
    if (activeStep === 0 && deployExtensionObj.type !== ExtensionType.Lambda) {
      if (
        !deployExtensionObj.distributionObj ||
        !deployExtensionObj.distributionObj.value
      ) {
        setDeployValidationError((prev) => {
          return { ...prev, distributionEmpty: true };
        });
        validRes = false;
        return validRes;
      }
      if (
        !deployExtensionObj.behaviorArr ||
        deployExtensionObj.behaviorArr.length <= 0
      ) {
        setDeployValidationError((prev) => {
          return { ...prev, behaviorEmpty: true };
        });
        validRes = false;
        return validRes;
      }
    }

    if (activeStep === 0 && deployExtensionObj.type === ExtensionType.Lambda) {
      const emptyValueKeyArr = [];
      const paramsArr = deployExtensionObj.paramList;
      paramsArr.forEach((element) => {
        if (!element.value.trim()) {
          element.isEmpty = true;
          emptyValueKeyArr.push(element.key);
        }
      });
      setdeployExtensionObj((prev) => {
        return {
          ...prev,
          paramList: paramsArr,
        };
      });
      return emptyValueKeyArr.length > 0 ? false : true;
    }
    return validRes;
  };

  // Deploy Extensions
  const startToDeployExtension = async () => {
    let commonParams: ParameterType[] = [];

    if (deployExtensionObj.type !== ExtensionType.Lambda) {
      commonParams = [
        {
          parameterKey: "cfDistId",
          parameterValue: deployExtensionObj.distributionObj?.value,
        },
        {
          parameterKey: "behavior",
          parameterValue: deployExtensionObj.behaviorArr,
        },
        { parameterKey: "stage", parameterValue: deployExtensionObj.stage },
      ];
    }
    const specifyParams: ParameterType[] = [];
    if (
      deployExtensionObj.paramList &&
      deployExtensionObj.paramList.length > 0
    ) {
      deployExtensionObj.paramList.forEach((element) => {
        specifyParams.push({
          parameterKey: element.key,
          parameterValue: element.value,
        });
      });
    }

    const deployParams = {
      name: deployExtensionObj.name,
      parameters: [...commonParams, ...specifyParams],
    };
    try {
      setLoadingDeploy(true);
      const resData = await appSyncRequestMutation(
        deployExtension,
        deployParams
      );
      setLoadingDeploy(false);
      if (resData.data.deployExtension) {
        setIsDeployed(true);
        setStackLink(resData.data.deployExtension);
      }
    } catch (error) {
      setLoadingDeploy(false);
      console.error(error);
    }
  };

  // Get Parameters By Extension Name
  const getParametersByExtensionName = async () => {
    try {
      setLoadingData(true);
      const resData = await appSyncRequestQuery(queryByName, {
        name: deployExtensionObj.name,
      });
      console.info("resData:", resData);
      if (resData.data.queryByName) {
        let tmpDataParamList: ParamsType[] = [];
        if (resData.data.queryByName.cfnParameter) {
          tmpDataParamList = JSON.parse(resData.data.queryByName.cfnParameter);
          tmpDataParamList.forEach((element: ParamsType) => {
            element.value = "";
          });
        }
        setdeployExtensionObj((prev) => {
          return {
            ...prev,
            codeUri: resData.data.queryByName.codeUri,
            desc: resData.data.queryByName.desc,
            stage: resData.data.queryByName.stage,
            type: resData.data.queryByName.type,
            paramList: tmpDataParamList,
          };
        });
      }
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getParametersByExtensionName();
  }, []);

  useEffect(() => {
    console.info("deployExtensionObj:", deployExtensionObj);
  }, [deployExtensionObj]);

  return (
    <div>
      <Breadcrumb list={BreadCrumbList} />
      {loadingData ? (
        <LoadingText />
      ) : isDeployed ? (
        <DeployResult
          stackLink={stackLink}
          deployExtensionObj={deployExtensionObj}
        />
      ) : (
        <div className="gsui-create-wrapper">
          <div className="create-step">
            <CreateStep
              activeIndex={activeStep}
              list={
                deployExtensionObj.type === ExtensionType.Lambda
                  ? [
                      { name: t("repository:deploy.step.fa") },
                      { name: t("repository:deploy.step.review") },
                    ]
                  : [
                      { name: t("repository:deploy.step.chooseCFD") },
                      {
                        name:
                          deployExtensionObj.type === ExtensionType.Lambda
                            ? t("repository:deploy.step.specifyParam")
                            : t("repository:deploy.step.fa"),
                      },
                      { name: t("repository:deploy.step.review") },
                    ]
              }
              selectStep={(step) => {
                console.info("step:", step);
              }}
            />
          </div>
          <div className="create-content m-w-800">
            {deployExtensionObj.type !== ExtensionType.Lambda &&
              activeStep === 0 && (
                <ChooseCloudFront
                  deployValidationError={deployValidationError}
                  deployExtensionObj={deployExtensionObj}
                  changeExtensionObjBehavior={(behavior) => {
                    setDeployValidationError((prev) => {
                      return { ...prev, behaviorEmpty: false };
                    });
                    setdeployExtensionObj((prev) => {
                      return {
                        ...prev,
                        behaviorArr: behavior,
                      };
                    });
                  }}
                  changeExtensionObjDistribution={(distribution) => {
                    setDeployValidationError((prev) => {
                      return { ...prev, distributionEmpty: false };
                    });
                    setdeployExtensionObj((prev) => {
                      return {
                        ...prev,
                        behaviorArr: [],
                        distributionObj: distribution,
                      };
                    });
                  }}
                />
              )}
            {((deployExtensionObj.type !== ExtensionType.Lambda &&
              activeStep === 1) ||
              (deployExtensionObj.type === ExtensionType.Lambda &&
                activeStep === 0)) && (
              <FunctionAssociations
                changeCloudFrontStage={(stage) => {
                  setdeployExtensionObj((prev) => {
                    return {
                      ...prev,
                      stage: stage,
                    };
                  });
                }}
                deployExtensionObj={deployExtensionObj}
                changeExtensionObjParamList={(params) => {
                  setdeployExtensionObj((prev) => {
                    return {
                      ...prev,
                      paramList: params,
                    };
                  });
                }}
              />
            )}
            {((deployExtensionObj.type !== ExtensionType.Lambda &&
              activeStep === 2) ||
              (deployExtensionObj.type === ExtensionType.Lambda &&
                activeStep === 1)) && (
              <Review deployExtensionObj={deployExtensionObj} />
            )}
            <div className="button-action text-right">
              <Button
                onClick={() => {
                  navigate(`/extentions-repository`);
                }}
              >
                {t("button.cancel")}
              </Button>
              {activeStep > 0 && (
                <Button
                  onClick={() => {
                    setActiveStep((prev) => {
                      return prev - 1;
                    });
                  }}
                >
                  {t("button.previous")}
                </Button>
              )}
              {((deployExtensionObj.type !== ExtensionType.Lambda &&
                activeStep < 2) ||
                (deployExtensionObj.type === ExtensionType.Lambda &&
                  activeStep < 1)) && (
                <Button
                  btnType="primary"
                  onClick={() => {
                    if (checkUserDeployInputValidation()) {
                      setActiveStep((prev) => {
                        return prev + 1;
                      });
                    }
                  }}
                >
                  {t("button.next")}
                </Button>
              )}
              {((deployExtensionObj.type !== ExtensionType.Lambda &&
                activeStep === 2) ||
                (deployExtensionObj.type === ExtensionType.Lambda &&
                  activeStep === 1)) && (
                <Button
                  loading={loadingDeploy}
                  btnType="primary"
                  onClick={() => {
                    startToDeployExtension();
                  }}
                >
                  {t("button.deploy")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deploy;
