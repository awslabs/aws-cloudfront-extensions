import React from "react";
import Alert from "components/Alert";
import HeaderPanel from "components/HeaderPanel";
import Select from "components/Select";
import FormItem from "components/FormItem";
import TextInput from "components/TextInput";
import { StageListMap } from "assets/js/const";
import { DeployExtensionObj, ParamsType } from "../Deploy";
import { ExtensionType } from "API";
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

  return (
    <div>
      {deployExtensionObj.type !== ExtensionType.Lambda && (
        <HeaderPanel
          title="Function associations"
          desc="Choose an edge function to associate with this cache behavior, and the CloudFront event that invokes the function."
        >
          <Alert content="WARNING: You are about to associate a function that will overwirte the existing function for the following cache behaviors. Are you sure you want to continue?" />
          <div className="m-w-75p mt-20">
            <div className="flex align-center">
              <div className="flex-2 align-center">
                <b>Extention</b>
              </div>
              <div className="flex-3 align-center">
                <b>CloudFront stage</b>
              </div>
            </div>
            <div className="flex align-center mt-15">
              <div className="flex-2 align-center">
                {deployExtensionObj.name}
              </div>
              <div className="flex-3 align-center">
                <Select
                  placeholder="Select stage"
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
        <HeaderPanel title={`${deployExtensionObj.name} Parameters`} desc={""}>
          {deployExtensionObj.paramList.map((element, index) => {
            return (
              <FormItem
                key={index}
                optionTitle={element.key}
                optionDesc={element.desc}
              >
                <TextInput
                  className="m-w-75p"
                  onChange={(event) => {
                    const tmpParamList = JSON.parse(
                      JSON.stringify(deployExtensionObj.paramList)
                    );
                    tmpParamList[index].value = event.target.value;
                    changeExtensionObjParamList(tmpParamList);
                  }}
                  placeholder={`Please input ${element.key}`}
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
