import React, { useState, useEffect } from "react";
import AutoComplete from "components/AutoComplete";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import ExtLink from "components/ExtLink";
import { appSyncRequestQuery } from "assets/js/request";
import { behaviorById, listDistribution } from "graphql/queries";
import { Cloudfront_info } from "API";
import { OptionType } from "components/AutoComplete/autoComplete";
import MultiSelect from "components/MultiSelect";
import { SelectItem } from "components/Select/select";
import { DeployExtensionObj } from "../Deploy";

interface ChooseCloudFrontProps {
  deployExtensionObj: DeployExtensionObj;
  changeExtensionObjDistribution: (distribution: OptionType) => void;
  changeExtensionObjBehavior: (behaviors: string[]) => void;
}

const ChooseCloudFront: React.FC<ChooseCloudFrontProps> = (
  props: ChooseCloudFrontProps
) => {
  const {
    deployExtensionObj,
    changeExtensionObjDistribution,
    changeExtensionObjBehavior,
  } = props;
  const [loadingData, setLoadingData] = useState(false);
  const [loadingBehavior, setLoadingBehavior] = useState(false);
  const [cloudFrontList, setCloudFrontList] = useState<OptionType[]>([]);
  const [behaviorList, setBehaviorList] = useState<SelectItem[]>([]);

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    try {
      setLoadingData(true);
      setCloudFrontList([]);
      const resData = await appSyncRequestQuery(listDistribution, {
        page: 1,
        count: 10,
      });
      const cfList: Cloudfront_info[] = resData.data?.listDistribution || [];
      setLoadingData(false);
      const tmpCFOptionList: OptionType[] = [];
      if (cfList.length > 0) {
        cfList.forEach((element) => {
          tmpCFOptionList.push({
            name: `${element.id}(${element.domainName})`,
            value: element.id || "",
          });
        });
      }
      setCloudFrontList(tmpCFOptionList);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  // Get Behavior List
  const getBehaviorByDistributionId = async (id: string) => {
    try {
      setLoadingBehavior(true);
      const resData = await appSyncRequestQuery(behaviorById, {
        id: id,
      });
      setLoadingBehavior(false);
      const behaviorData: string[] = resData.data.behaviorById;
      const tmpBehaviorList: SelectItem[] = [];
      if (behaviorData.length > 0) {
        behaviorData.forEach((element) => {
          tmpBehaviorList.push({
            name: element,
            value: element,
          });
        });
      }
      setBehaviorList(tmpBehaviorList);
    } catch (error) {
      setLoadingBehavior(false);
      console.error(error);
    }
  };

  useEffect(() => {
    if (
      deployExtensionObj.distributionObj &&
      deployExtensionObj.distributionObj.value
    ) {
      changeExtensionObjBehavior([]);
      getBehaviorByDistributionId(deployExtensionObj.distributionObj.value);
    }
  }, [deployExtensionObj.distributionObj]);

  useEffect(() => {
    getCloudfrontDistributionList();
  }, []);

  return (
    <div>
      <HeaderPanel title="CloudFront Distribution">
        <FormItem
          optionTitle="Distributions"
          optionDesc={
            <div>
              Choose a CloudFront distribution or create a new one in{" "}
              <ExtLink to="/">CloudFront console</ExtLink> to deploy CloudFront
              Extensions.
            </div>
          }
        >
          <AutoComplete
            loading={loadingData}
            className="m-w-75p"
            value={deployExtensionObj.distributionObj}
            optionList={cloudFrontList}
            placeholder="Choose CloudFront distribution"
            onChange={(event, data) => {
              console.info(event, data);
              changeExtensionObjDistribution(data);
            }}
          />
        </FormItem>
        <FormItem
          optionTitle="Behaviors"
          optionDesc={<div>Choose a behavior to deploy the extensions</div>}
        >
          <MultiSelect
            className="m-w-45p"
            loading={loadingBehavior}
            optionList={behaviorList}
            value={deployExtensionObj.behaviorArr}
            placeholder="Select behavior"
            onChange={(items) => {
              changeExtensionObjBehavior(items);
            }}
          />
        </FormItem>
      </HeaderPanel>
    </div>
  );
};

export default ChooseCloudFront;
