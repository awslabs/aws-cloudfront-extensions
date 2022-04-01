import React, { useState } from "react";
import Alert from "components/Alert";
import HeaderPanel from "components/HeaderPanel";
import Select from "components/Select";
import { CF_STAGE_LIST } from "mock/data";
import FormItem from "components/FormItem";
import TextInput from "components/TextInput";

const EXT_LIST = [
  {
    name: "anti-hotlinking",
    stage: "",
  },
];

const FunctionAssociations: React.FC = () => {
  const [extensionList, setExtensionList] = useState(EXT_LIST);
  const [antiValue, setAntiValue] = useState("*.example.com, www.amazon.com");

  return (
    <div>
      <HeaderPanel
        title="Function associations"
        desc="Choose an edge function to associate with this cache behavior, and the CloudFront event that invokes the function."
      >
        <Alert
          title="Function associated"
          content="CloudFront distribution xxx has function deployed on viewer-request, viewer-response"
        />
        <div className="m-w-75p mt-20">
          <div className="flex align-center">
            <div className="flex-2 align-center">
              <b>Extention</b>
            </div>
            <div className="flex-3 align-center">
              <b>CloudFront stage</b>
            </div>
          </div>
          {extensionList.map((element, index) => {
            return (
              <div className="flex align-center mt-15" key={index}>
                <div className="flex-2 align-center">{element.name}</div>
                <div className="flex-3 align-center">
                  <Select
                    placeholder="Select stage"
                    onChange={(event) => {
                      setExtensionList((prev) => {
                        const tmpData = JSON.parse(JSON.stringify(prev));
                        tmpData[index].stage = event.target.value;
                        return tmpData;
                      });
                    }}
                    value={element.stage}
                    optionList={CF_STAGE_LIST}
                  ></Select>
                </div>
              </div>
            );
          })}
        </div>
      </HeaderPanel>

      <HeaderPanel
        title="anti-hotlinking Parameters"
        desc="Parameters are defined in your template and allow you to input custom values when you deploy extensions"
      >
        <FormItem optionTitle="Parameters" optionDesc="Whitelist">
          <TextInput
            className="m-w-75p"
            onChange={(event) => {
              setAntiValue(event.target.value);
            }}
            placeholder="Input value"
            value={antiValue}
          />
        </FormItem>
      </HeaderPanel>
    </div>
  );
};

export default FunctionAssociations;
