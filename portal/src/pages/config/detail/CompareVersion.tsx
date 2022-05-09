import React, { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Button from "components/Button";
import Select from "components/Select";
import { CF_VERSION_LIST } from "mock/data";
import { useParams } from "react-router-dom";
import { appSyncRequestQuery } from "../../../assets/js/request";
import {
  getConfigContent,
  listCloudfrontVersions,
} from "../../../graphql/queries";
import { Version } from "../../../API";

const CompareVersion: React.FC = () => {
  const { id } = useParams();
  const { ver1 } = useParams();
  const { ver2 } = useParams();
  const [leftVersion, setLeftVersion] = useState<any>(ver1);
  const [rightVersion, setRightVersion] = useState<any>(ver2);
  const [leftContent, setLeftContent] = useState<any>("");
  const [rightContent, setRightContent] = useState<any>("");
  const [distribution, setDistribution] = useState<any>(id);
  const [versionList, setVersionList] = useState<any[]>([]);

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
      name: "Compare",
    },
  ];

  const myInit = () => {
    getLeftVersionContent();
    getRightVersionContent();
    getVersionListByDistribution();
  };

  useEffect(() => {
    myInit();
  }, []);

  // Get Left Version By Distribution
  const getLeftVersionContent = async () => {
    try {
      const resData = await appSyncRequestQuery(getConfigContent, {
        distribution_id: id,
        versionId: leftVersion,
      });
      setLeftContent(resData.data.getConfigContent);
    } catch (error) {
      console.error(error);
    }
  };

  // Get Right Version By Distribution
  const getRightVersionContent = async () => {
    try {
      const resData = await appSyncRequestQuery(getConfigContent, {
        distribution_id: id,
        versionId: rightVersion,
      });
      setRightContent(resData.data.getConfigContent);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getLeftVersionContent();
  }, [leftVersion]);

  useEffect(() => {
    getRightVersionContent();
  }, [rightVersion]);

  // Get Version List By Distribution
  const getVersionListByDistribution = async () => {
    try {
      setVersionList([]);
      const resData = await appSyncRequestQuery(listCloudfrontVersions, {
        distribution_id: id,
      });
      const versionList: Version[] = resData.data.listCloudfrontVersions;
      const tmpList = [];
      for (const versionKey in versionList) {
        tmpList.push({
          name:
            versionList[versionKey].versionId +
            " : " +
            versionList[versionKey].note,
          value: versionList[versionKey].versionId,
        });
      }
      setVersionList(tmpList);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div>
        <HeaderPanel title="Please select the version to compare">
          <div>
            <div className="flex">
              <div className="flex-1">
                <Select
                  // className="m-w-320"
                  value={leftVersion}
                  optionList={versionList}
                  placeholder="Select version"
                  onChange={(event) => {
                    console.info("left value is ", event.target.value);
                    setLeftVersion(event.target.value);
                    getLeftVersionContent();
                  }}
                />
              </div>
              <div className="flex-1 flex justify-between">
                <div className="flex-1">
                  <Select
                    // className="m-w-320"
                    value={rightVersion}
                    optionList={versionList}
                    placeholder="Select version"
                    onChange={(event) => {
                      console.info("right value is ", event.target.value);
                      setRightVersion(event.target.value);
                      getRightVersionContent();
                    }}
                  />
                </div>
                {/*<Button btnType="primary">Compare</Button>*/}
              </div>
            </div>
            <div className="mt-10">
              <ReactDiffViewer
                oldValue={leftContent}
                newValue={rightContent}
                splitView={true}
              />
            </div>
          </div>
        </HeaderPanel>
      </div>
    </div>
  );
};

export default CompareVersion;
