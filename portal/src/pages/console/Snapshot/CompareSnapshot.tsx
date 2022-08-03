import React, { useEffect, useState } from "react";
import deepEqual from "deep-equal";
import ReactDiffViewer from "react-diff-viewer";
import PauseCircleFilledIcon from "@material-ui/icons/PauseCircleFilled";
import SwapHorizontalCircleIcon from "@material-ui/icons/SwapHorizontalCircle";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Select from "components/Select";
import { useParams } from "react-router-dom";
import { appSyncRequestQuery } from "../../../assets/js/request";
import {
  getConfigSnapshotContent,
  listCloudfrontSnapshots,
} from "../../../graphql/queries";
import { Snapshot } from "../../../API";
import LoadingText from "components/LoadingText";

export enum COMPARE_RESULT {
  SAME = "SAME",
  DIFF = "DIFF",
  FIRST_HAVE = "FIRST_HAVE",
  SECOND_HAVE = "SECOND_HAVE",
}

const CompareSnapshot: React.FC = () => {
  const { id } = useParams();
  const { snapshot1 } = useParams();
  const { snapshot2 } = useParams();
  const [leftSnapshot, setLeftSnapshot] = useState<any>(snapshot1);
  const [rightSnapshot, setRightSnapshot] = useState<any>(snapshot2);
  const [leftContent, setLeftContent] = useState<any>("");
  const [rightContent, setRightContent] = useState<any>("");
  const [snapshotList, setSnapshotList] = useState<any[]>([]);
  const [snapshotDiffRes, setSnapshotDiffRes] = useState<any>({});
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [loadingChangeSnapshot, setLoadingChangeSnapshot] = useState(false);
  const [onlyShowDiff, setOnlyShowDiff] = useState(false);

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
      name: id || "",
      link: "/config/snapshot/detail/" + id,
    },
    {
      name: "Compare",
    },
  ];

  useEffect(() => {
    getSnapshotListByDistribution();
  }, []);

  // Get Left Snapshot By Distribution
  const getLeftSnapshotContent = async () => {
    setLoadingChangeSnapshot(true);
    try {
      const resData = await appSyncRequestQuery(getConfigSnapshotContent, {
        distribution_id: id,
        snapshot_name: leftSnapshot,
      });
      setLeftContent(resData.data.getConfigSnapshotContent);
      setLoadingChangeSnapshot(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Get Right Snapshot By Distribution
  const getRightSnapshotContent = async () => {
    setLoadingChangeSnapshot(true);
    try {
      const resData = await appSyncRequestQuery(getConfigSnapshotContent, {
        distribution_id: id,
        snapshot_name: rightSnapshot,
      });
      setRightContent(resData.data.getConfigSnapshotContent);
      setLoadingChangeSnapshot(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getLeftSnapshotContent();
  }, [leftSnapshot]);

  useEffect(() => {
    getRightSnapshotContent();
  }, [rightSnapshot]);

  // const isEmptyObject = function (obj: any) {
  //   let name;
  //   for (name in obj) {
  //     return false;
  //   }
  //   return true;
  // };

  // const deepCompare = (obj1: any, obj2: any): any => {
  //   const result: any = {};
  //   let change;
  //   for (const key in obj1) {
  //     if (typeof obj2[key] === "object" && typeof obj1[key] === "object") {
  //       change = deepCompare(obj1[key], obj2[key]);
  //       if (isEmptyObject(change) === false) {
  //         result[key] = change;
  //       }
  //     } else if (obj2[key] !== obj1[key]) {
  //       result[key] = obj2[key];
  //     }
  //   }
  //   return result;
  // };

  const compare = (obj1: any, obj2: any): any => {
    const result: any = {};
    for (const key in obj1) {
      result[key] = {};
      result[key]["show"] = false;
      result[key]["showLeft"] = false;
      result[key]["showRight"] = false;
      if (typeof obj2[key] === "object" && typeof obj1[key] === "object") {
        // const obj1Str = JSON.stringify(obj1[key]);
        // const obj2Str = JSON.stringify(obj2[key]);
        // if (obj1Str !== obj2Str) {
        if (!deepEqual(obj1[key], obj2[key])) {
          result[key]["res"] = COMPARE_RESULT.DIFF;
          result[key]["data1"] = obj1[key];
          result[key]["data2"] = obj2[key];
        } else {
          result[key]["res"] = COMPARE_RESULT.SAME;
          result[key]["data"] = obj2[key];
        }
      } else if (obj2[key] !== obj1[key]) {
        result[key]["res"] = COMPARE_RESULT.DIFF;
        result[key]["data1"] = obj1[key];
        result[key]["data2"] = obj2[key];
      } else {
        result[key]["res"] = COMPARE_RESULT.SAME;
        result[key]["data"] = obj2[key];
      }
    }
    // Loop through the first object and find missing items in object2
    for (const key in obj1) {
      if (obj2[key] === undefined) {
        result[key] = {
          res: COMPARE_RESULT.FIRST_HAVE,
          data1: obj1[key],
        };
      }
    }

    // Loop through the second object and find missing items in object1
    for (const key in obj2) {
      if (obj1[key] === undefined) {
        result[key] = {
          res: COMPARE_RESULT.SECOND_HAVE,
          data1: obj2[key],
        };
      }
    }
    return result;
  };

  useEffect(() => {
    if (leftContent && rightContent) {
      const leftJSON = JSON.parse(leftContent.toString());
      const rightJSON = JSON.parse(rightContent.toString());
      // const leftJSON = JSON.parse(leftContent.replace(/\s+/g, "").toString());
      // Test First Have & Second Have Start
      // delete leftJSON.WebACLId;
      // delete rightJSON.IsIPV6Enabled;
      // Test First Have & Second Have End
      const res = compare(leftJSON, rightJSON);
      setSnapshotDiffRes(res);
    }
  }, [leftContent, rightContent]);

  const showConfigDetail = (
    key: string,
    type: COMPARE_RESULT,
    show: boolean
  ) => {
    console.info("show:", show);
    const tmpCompareRes = JSON.parse(JSON.stringify(snapshotDiffRes));
    if (type === COMPARE_RESULT.SAME || type === COMPARE_RESULT.DIFF) {
      tmpCompareRes[key].show = show;
    }
    if (type === COMPARE_RESULT.FIRST_HAVE) {
      tmpCompareRes[key].showLeft = show;
    }
    if (type === COMPARE_RESULT.SECOND_HAVE) {
      tmpCompareRes[key].showRight = show;
    }
    setSnapshotDiffRes(tmpCompareRes);
  };

  // Get Snapshot List By Distribution
  const getSnapshotListByDistribution = async () => {
    setLoadingDistribution(true);
    try {
      setSnapshotList([]);
      const resData = await appSyncRequestQuery(listCloudfrontSnapshots, {
        distribution_id: id,
      });
      const snapshotList: Snapshot[] = resData.data.listCloudfrontSnapshots;
      const tmpList = [];
      for (const snapshotKey in snapshotList) {
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
      setSnapshotList(tmpList);
      setLoadingDistribution(false);
      // myInit();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div>
        <HeaderPanel title="Please select the snapshot to compare">
          {loadingDistribution ? (
            <LoadingText />
          ) : (
            <div>
              <div className="flex">
                <div className="flex-1">
                  <Select
                    // className="m-w-320"
                    value={leftSnapshot}
                    optionList={snapshotList}
                    placeholder="Select snapshot"
                    onChange={(event) => {
                      console.info("left value is ", event.target.value);
                      setLeftSnapshot(event.target.value);
                    }}
                  />
                </div>
                <div className="flex-1 flex justify-between">
                  <div className="flex-1 ml-5">
                    <Select
                      // className="m-w-320"
                      value={rightSnapshot}
                      optionList={snapshotList}
                      placeholder="Select snapshot"
                      onChange={(event) => {
                        console.info("right value is ", event.target.value);
                        setRightSnapshot(event.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-15 ml-5">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyShowDiff}
                    onChange={(event) => {
                      setOnlyShowDiff(event.target.checked);
                    }}
                  />{" "}
                  Show Different Sections Only
                </label>
                {/* {onlyShowDiff && (
                  <Button
                    onClick={() => {
                      setOnlyShowDiff(false);
                    }}
                  >
                    Show All Sections
                  </Button>
                )}
                {!onlyShowDiff && (
                  <Button
                    onClick={() => {
                      setOnlyShowDiff(true);
                    }}
                  >
                    Only Show Different Sections
                  </Button>
                )} */}
              </div>
              <div className="mt-10 version-compare">
                {loadingChangeSnapshot ? (
                  <LoadingText />
                ) : (
                  <div>
                    <table className="compare" width="100%">
                      <thead>
                        <tr>
                          <th style={{ width: 200 }}>Config Section</th>
                          <th align="center">
                            <div className="text-center">
                              Snapshot {leftSnapshot}
                            </div>
                          </th>
                          <th align="center">
                            <div className="text-center">
                              Snapshot {rightSnapshot}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(snapshotDiffRes).map((key) => {
                          return (
                            <>
                              {snapshotDiffRes[key].res ===
                                COMPARE_RESULT.SAME &&
                                !onlyShowDiff && (
                                  <tr key={key}>
                                    <td>
                                      <div className="key">{key}</div>
                                    </td>
                                    <td colSpan={2} align="center">
                                      <div className="same">
                                        <span>
                                          Same{" "}
                                          <PauseCircleFilledIcon className="icon reverse-90" />
                                        </span>
                                        <span className="show-btn">
                                          (
                                          {!snapshotDiffRes[key].show && (
                                            <span
                                              onClick={() => {
                                                showConfigDetail(
                                                  key,
                                                  COMPARE_RESULT.SAME,
                                                  true
                                                );
                                              }}
                                            >
                                              <b>Show</b>
                                            </span>
                                          )}
                                          {snapshotDiffRes[key].show && (
                                            <span
                                              onClick={() => {
                                                showConfigDetail(
                                                  key,
                                                  COMPARE_RESULT.SAME,
                                                  false
                                                );
                                              }}
                                            >
                                              <b>Hide</b>
                                            </span>
                                          )}
                                          )
                                        </span>
                                      </div>
                                      {snapshotDiffRes[key].show && (
                                        <div className="text-left bg-gray">
                                          <pre>
                                            {JSON.stringify(
                                              snapshotDiffRes[key].data,
                                              null,
                                              2
                                            )}
                                          </pre>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              {snapshotDiffRes[key].res ===
                                COMPARE_RESULT.DIFF && (
                                <tr key={key}>
                                  <td>
                                    <div className="key">{key}</div>
                                  </td>
                                  <td colSpan={2} align="center">
                                    <div className="diff">
                                      <span>
                                        Different <SwapHorizontalCircleIcon />
                                      </span>
                                      <span className="show-btn">
                                        (
                                        {!snapshotDiffRes[key].show && (
                                          <span
                                            onClick={() => {
                                              showConfigDetail(
                                                key,
                                                COMPARE_RESULT.DIFF,
                                                true
                                              );
                                            }}
                                          >
                                            <b>Show</b>
                                          </span>
                                        )}
                                        {snapshotDiffRes[key].show && (
                                          <span
                                            onClick={() => {
                                              showConfigDetail(
                                                key,
                                                COMPARE_RESULT.DIFF,
                                                false
                                              );
                                            }}
                                          >
                                            <b>Hide</b>
                                          </span>
                                        )}
                                        )
                                      </span>
                                    </div>
                                    {snapshotDiffRes[key].show && (
                                      <div>
                                        <ReactDiffViewer
                                          oldValue={JSON.stringify(
                                            snapshotDiffRes[key].data1,
                                            null,
                                            2
                                          )}
                                          newValue={JSON.stringify(
                                            snapshotDiffRes[key].data2,
                                            null,
                                            2
                                          )}
                                          splitView={true}
                                        />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}

                              {snapshotDiffRes[key].res ===
                                COMPARE_RESULT.FIRST_HAVE && (
                                <tr key={key}>
                                  <td>
                                    <div className="key">{key}</div>
                                  </td>
                                  <td align="center">
                                    <div>
                                      <span className="show-btn">
                                        (
                                        {!snapshotDiffRes[key].showLeft && (
                                          <span
                                            onClick={() => {
                                              showConfigDetail(
                                                key,
                                                COMPARE_RESULT.FIRST_HAVE,
                                                true
                                              );
                                            }}
                                          >
                                            <b>Show</b>
                                          </span>
                                        )}
                                        {snapshotDiffRes[key].showLeft && (
                                          <span
                                            onClick={() => {
                                              showConfigDetail(
                                                key,
                                                COMPARE_RESULT.FIRST_HAVE,
                                                false
                                              );
                                            }}
                                          >
                                            <b>Hide</b>
                                          </span>
                                        )}
                                        )
                                      </span>
                                    </div>
                                    {snapshotDiffRes[key].showLeft && (
                                      <div className="text-left bg-gray">
                                        <pre>
                                          {JSON.stringify(
                                            snapshotDiffRes[key].data1,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </td>
                                  <td align="center">N/A</td>
                                </tr>
                              )}

                              {snapshotDiffRes[key].res ===
                                COMPARE_RESULT.SECOND_HAVE && (
                                <tr key={key}>
                                  <td>
                                    <div className="key">{key}</div>
                                  </td>
                                  <td align="center">N/A</td>
                                  <td align="center">
                                    <div>
                                      <span className="show-btn">
                                        (
                                        {!snapshotDiffRes[key].showRight && (
                                          <span
                                            onClick={() => {
                                              showConfigDetail(
                                                key,
                                                COMPARE_RESULT.SECOND_HAVE,
                                                true
                                              );
                                            }}
                                          >
                                            <b>Show</b>
                                          </span>
                                        )}
                                        {snapshotDiffRes[key].showRight && (
                                          <span
                                            onClick={() => {
                                              showConfigDetail(
                                                key,
                                                COMPARE_RESULT.SECOND_HAVE,
                                                false
                                              );
                                            }}
                                          >
                                            <b>Hide</b>
                                          </span>
                                        )}
                                        )
                                      </span>
                                    </div>
                                    {snapshotDiffRes[key].showRight && (
                                      <div className="text-left bg-gray">
                                        <pre>
                                          {JSON.stringify(
                                            snapshotDiffRes[key].data1,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </HeaderPanel>
      </div>
    </div>
  );
};

export default CompareSnapshot;
