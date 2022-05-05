import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import TextInput from "components/TextInput";
import TextArea from "components/TextArea";
import TagList from "components/TagList";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";

const SaveVersion: React.FC = () => {
  const [distribution, setDistribution] = useState("XLOWCQQFJJHM80");
  const [versionDesc, setVersionDesc] = useState("");
  const navigate = useNavigate();
  const BreadCrunbList = [
    {
      name: "CloudFront Extensions",
      link: "/",
    },
    {
      name: "Configuration Version",
      link: "/config/version",
    },
    {
      name: "XLOWCQQFJJHM80",
      link: "/config/version/detail/XLOWCQQFJJHM80",
    },
    {
      name: "Save",
    },
  ];
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title="Save version">
          <HeaderPanel title="Version settings">
            <div className="m-w-75p">
              <FormItem optionTitle="Distribution" optionDesc="">
                <TextInput
                  disabled
                  value={distribution}
                  onChange={(event) => {
                    setDistribution(event.target.value);
                  }}
                />
              </FormItem>
              <FormItem optionTitle="Distribution" optionDesc="">
                <TextArea
                  placeholder="beta testing"
                  rows={3}
                  value={versionDesc}
                  onChange={(event) => {
                    setVersionDesc(event.target.value);
                  }}
                />
              </FormItem>
            </div>
          </HeaderPanel>

          <HeaderPanel
            title="Tags"
            desc="A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You can use tags to search and filter your resources or track your AWS costs."
          >
            <TagList
              tagList={[]}
              addTag={() => {
                console.info("add");
              }}
              removeTag={(e) => {
                console.info(e);
              }}
              onChange={(e) => {
                console.info(e);
              }}
            />
          </HeaderPanel>
          <div className="button-action text-right">
            <Button
              onClick={() => {
                navigate("/config/version/detail/XLOWCQQFJJHM80");
              }}
            >
              Cancel
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/version/detail/XLOWCQQFJJHM80");
              }}
            >
              Save
            </Button>
          </div>
        </PagePanel>
      </div>
    </div>
  );
};

export default SaveVersion;
