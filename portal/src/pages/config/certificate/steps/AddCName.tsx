import React, { useState } from "react";
import FormItem from "components/FormItem";
import PagePanel from "components/PagePanel";
import TextArea from "components/TextArea";
import HeaderPanel from "components/HeaderPanel";

const AddCName: React.FC = () => {
  const [cnameList, setCnameList] = useState("");
  return (
    <div>
      <PagePanel title="Add CName">
        <HeaderPanel title="CName list">
          <FormItem
            optionTitle="Domain names (CNAMEs)"
            optionDesc="List any custom domain names that you use in addition to the CloudFront domain name for the URLs for your files."
          >
            <TextArea
              placeholder={`www.example1.com\nwww.example2.com`}
              tips="Specify up to 100 CNAMEs separated with commas, or put each on a new
              line."
              rows={3}
              value={cnameList}
              onChange={(event) => {
                setCnameList(event.target.value);
              }}
            />
          </FormItem>
        </HeaderPanel>
      </PagePanel>
    </div>
  );
};

export default AddCName;
