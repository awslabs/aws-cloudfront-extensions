import React, { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Select from "components/Select";
import { useParams } from "react-router-dom";
import { appSyncRequestQuery } from "../../../assets/js/request";
import {
  getConfigContent,
  listCloudfrontVersions,
} from "../../../graphql/queries";
import { Version } from "../../../API";
import { useTranslation } from "react-i18next";

const VersionDetailDisplay: React.FC = () => {
  const { id } = useParams();
  const { version } = useParams();
  const [currentVersion, setCurrentVersion] = useState<any>(version);
  const [versionContent, setVersionContent] = useState<any>("");
  const [versionList, setVersionList] = useState<any[]>([]);
  const { t } = useTranslation();

  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("version:name"),
      link: "/config/version",
    },
    {
      name: id || "",
      link: "/config/version/detail/" + id,
    },
  ];

  const myInit = () => {
    getVersionContent();
    getVersionListByDistribution();
  };

  useEffect(() => {
    myInit();
  }, []);

  // Get Left Version By Distribution
  const getVersionContent = async () => {
    try {
      const resData = await appSyncRequestQuery(getConfigContent, {
        distribution_id: id,
        versionId: currentVersion,
      });
      setVersionContent(resData.data.getConfigContent);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getVersionContent();
  }, [currentVersion]);

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
            "\t|\t" +
            versionList[versionKey].dateTime +
            "\t|\t" +
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
        <HeaderPanel title={t("version:detail.title") + currentVersion}>
          <div>
            <div className="flex">
              <div className="flex-1">
                <Select
                  // className="m-w-320"
                  value={currentVersion}
                  optionList={versionList}
                  placeholder={t("version:detail.selectVersion")}
                  onChange={(event) => {
                    setCurrentVersion(event.target.value);
                    getVersionContent();
                  }}
                />
              </div>
            </div>
            <div className="mt-10">
              <ReactDiffViewer newValue={versionContent} splitView={false} />
            </div>
          </div>
        </HeaderPanel>
      </div>
    </div>
  );
};

export default VersionDetailDisplay;
