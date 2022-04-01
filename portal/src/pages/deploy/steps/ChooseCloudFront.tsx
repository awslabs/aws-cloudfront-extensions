import React, { useState } from "react";
import AutoComplete from "components/AutoComplete";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import ExtLink from "components/ExtLink";
import Select from "components/Select";

export const CLOUDFRONT_LIST_OPTIONS = [
  { name: "XLOWCQQFJJHM80", value: "bbb.cloudfront.net" },
  { name: "XEWIDSGMPMEK86", value: "abc.cloudfront.net" },
];

const ChooseCloudFront: React.FC = () => {
  const [cloudFrontObj, setCloudFrontObj] = useState<any>();
  const [behavior, setBehavior] = useState("");
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
            className="m-w-75p"
            value={cloudFrontObj}
            optionList={CLOUDFRONT_LIST_OPTIONS}
            placeholder="Choose CloudFront distribution"
            onChange={(event, data) => {
              console.info(event, data);
              setCloudFrontObj(data);
            }}
          />
        </FormItem>
        <FormItem
          optionTitle="Behaviors"
          optionDesc={<div>Choose a behavior to deploy the extensions</div>}
        >
          <Select
            className="m-w-75p"
            value={behavior}
            optionList={CLOUDFRONT_LIST_OPTIONS}
            placeholder="Default (*)"
            onChange={(event) => {
              console.info(event);
              setBehavior(event.target.value);
            }}
          />
        </FormItem>
      </HeaderPanel>
    </div>
  );
};

export default ChooseCloudFront;
