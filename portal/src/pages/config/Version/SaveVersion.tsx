import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import TextInput from "components/TextInput";
import TextArea from "components/TextArea";
import TagList from "components/TagList";
import Button from "components/Button";
import { useNavigate, useParams } from "react-router-dom";
import { appSyncRequestQuery } from "assets/js/request";
import { updateConfigTag } from "graphql/queries";

const SaveVersion: React.FC = () => {
  const [distribution, setDistribution] = useState<any>("");
  const [versionDesc, setVersionDesc] = useState<any>("");
  const { id } = useParams<string>();
  const { version } = useParams<string>();
  const { note } = useParams<string>();
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
      name: distribution,
      link: "/config/version/detail/" + distribution,
    },
    {
      name: "Save",
    },
  ];

  const myLog = () => {
    setDistribution(id);
    console.info("note is " + note);
    setVersionDesc(note || "");
  };

  useEffect(() => {
    myLog();
  }, []);

  // Get Version List By Distribution
  const updateDistConfigTag = async (
    distId: string,
    ver: string,
    note: string
  ) => {
    try {
      await appSyncRequestQuery(updateConfigTag, {
        distribution_id: distId,
        version: ver,
        note: note,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title="Save note for specific config version">
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
              <FormItem optionTitle="Note" optionDesc="">
                <TextArea
                  placeholder="beta testing"
                  rows={2}
                  value={versionDesc}
                  onChange={(event) => {
                    setVersionDesc(event.target.value);
                  }}
                />
              </FormItem>
            </div>
          </HeaderPanel>

          {/* <HeaderPanel
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
          </HeaderPanel> */}
          <div className="button-action text-right">
            <Button
              onClick={() => {
                navigate("/config/version/detail/" + id);
              }}
            >
              Cancel
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                const dist_id: any = id;
                const ver: any = version;
                updateDistConfigTag(dist_id, ver, versionDesc);
                navigate("/config/version/detail/" + id);
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