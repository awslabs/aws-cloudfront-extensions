import React from "react";
import Alert from "components/Alert";
import HeaderPanel from "components/HeaderPanel";
import Select from "components/Select";
import FormItem from "components/FormItem";
import TextInput from "components/TextInput";
import { StageListMap } from "assets/js/const";
import { DeployExtensionObj, ParamsType } from "../Deploy";
import { ExtensionType } from "API";
import { useTranslation } from "react-i18next";
interface FunctionAssociationsProps {
  deployExtensionObj: DeployExtensionObj;
  changeExtensionObjParamList: (params: ParamsType[]) => void;
  changeCloudFrontStage: (stage: string) => void;
}

const FunctionAssociations: React.FC<FunctionAssociationsProps> = (
  props: FunctionAssociationsProps
) => {
  const {
    deployExtensionObj,
    changeExtensionObjParamList,
    changeCloudFrontStage,
  } = props;

  const { t } = useTranslation();

  return (
    <div>
      {deployExtensionObj.type !== ExtensionType.Lambda && (
        <HeaderPanel
          title={t("repository:deploy.fa.title")}
          desc={t("repository:deploy.fa.titleDesc")}
        >
          <Alert content={t("repository:deploy.fa.alert")} />
          <div className="m-w-75p mt-20">
            <div className="flex align-center">
              <div className="flex-2 align-center">
                <b>{t("repository:deploy.fa.ext")}</b>
              </div>
              <div className="flex-3 align-center">
                <b>{t("repository:deploy.fa.statge")}</b>
              </div>
            </div>
            <div className="flex align-center mt-15">
              <div className="flex-2 align-center">
                {deployExtensionObj.name}
              </div>
              <div className="flex-3 align-center">
                <Select
                  placeholder={t("repository:deploy.fa.selectStage")}
                  onChange={(event) => {
                    changeCloudFrontStage(event.target.value);
                  }}
                  value={deployExtensionObj.stage}
                  optionList={StageListMap[deployExtensionObj.type]}
                ></Select>
              </div>
            </div>
          </div>
        </HeaderPanel>
      )}

      {deployExtensionObj.paramList.length > 0 && (
        <HeaderPanel
          title={`${deployExtensionObj.name} ${t(
            "repository:deploy.fa.param"
          )}`}
          desc={""}
        >
          {deployExtensionObj.paramList.map((element, index) => {
            return (
              <FormItem
                key={index}
                optionTitle={element.key}
                optionDesc={element.desc}
                errorText={
                  element.isEmpty
                    ? t("repository:deploy.fa.inputPrefix") + element.key
                    : ""
                }
              >
                <TextInput
                  className="m-w-75p"
                  onChange={(event) => {
                    const tmpParamList = JSON.parse(
                      JSON.stringify(deployExtensionObj.paramList)
                    );
                    tmpParamList[index].value = event.target.value;
                    tmpParamList[index].isEmpty = false;
                    changeExtensionObjParamList(tmpParamList);
                  }}
                  placeholder={`${t("repository:deploy.fa.inputPrefix")} ${
                    element.key
                  }`}
                  value={element.value}
                />
              </FormItem>
            );
          })}
        </HeaderPanel>
      )}
    </div>
  );
};

export default FunctionAssociations;
