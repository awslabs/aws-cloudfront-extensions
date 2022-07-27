import React, { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Button from "components/Button";
import Select from "components/Select";
import { useParams } from "react-router-dom";
import { appSyncRequestQuery } from "../../../assets/js/request";
import {
  getConfigContent,
  getConfigSnapshotContent,
  listCloudfrontSnapshots,
} from "../../../graphql/queries";
import { Snapshot } from "../../../API";

const SnapshotDetailDisplay: React.FC = () => {
  const { id } = useParams();
  const { snapshot } = useParams();
  const [currentSnapshot, setCurrentSnapshot] = useState<any>(snapshot);
  const [snapshotContent, setSnapshotContent] = useState<any>("");
  const [distribution, setDistribution] = useState<any>(id);
  const [snapshotList, setSnapshotList] = useState<any[]>([]);

  const BreadCrunbList = [
    {
      name: "CloudFront Extensions",
      link: "/",
    },
    {
      name: "Configuration Snapshot",
      link: "/config/snapshot",
    },
    {
      name: distribution,
      link: "/config/snapshot/detail/" + distribution,
    },
    {
      name: "",
    },
  ];

  const myInit = () => {
    getSnapshotContent();
    getSnapshotListByDistribution();
  };

  useEffect(() => {
    myInit();
  }, []);

  // Get Left Snapshot By Distribution
  const getSnapshotContent = async () => {
    try {
      const resData = await appSyncRequestQuery(getConfigSnapshotContent, {
        distribution_id: id,
        snapshot_name: currentSnapshot,
      });
      setSnapshotContent(resData.data.getConfigSnapshotContent);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getSnapshotContent();
  }, [currentSnapshot]);

  // Get Snapshot List By Distribution
  const getSnapshotListByDistribution = async () => {
    try {
      setSnapshotList([]);
      const resData = await appSyncRequestQuery(listCloudfrontSnapshots, {
        distribution_id: id,
      });
      const snapshotList: Snapshot[] = resData.data.listCloudfrontSnapshots;
      const tmpList = [];
      for (const snapshotKey in snapshotList) {
        if (snapshotList[snapshotKey].snapshot_name != "_LATEST_") {
          tmpList.push({
            name:
              snapshotList[snapshotKey].snapshot_name +
              "\t|\t" +
              snapshotList[snapshotKey].dateTime +
              "\t|\t" +
              snapshotList[snapshotKey].note,
            value: snapshotList[snapshotKey].snapshot_name,
          });
        }
      }
      setSnapshotList(tmpList);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div>
        <HeaderPanel
          title={
            "Detail Configuration of distribution: " +
            distribution +
            " with snapshot: " +
            currentSnapshot
          }
        >
          <div>
            <div className="flex">
              <div className="flex-1">
                <Select
                  // className="m-w-320"
                  value={currentSnapshot}
                  optionList={snapshotList}
                  placeholder="Select snapshot"
                  onChange={(event) => {
                    setCurrentSnapshot(event.target.value);
                    getSnapshotContent();
                  }}
                />
              </div>
            </div>
            <div className="mt-10">
              <ReactDiffViewer newValue={snapshotContent} splitView={false} />
            </div>
          </div>
        </HeaderPanel>
      </div>
    </div>
  );
};

export default SnapshotDetailDisplay;
