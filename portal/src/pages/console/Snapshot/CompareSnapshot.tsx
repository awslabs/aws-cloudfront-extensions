import React, { useEffect, useState } from "react";
import deepEqual from "deep-equal";
import ReactDiffViewer from "react-diff-viewer-continued";
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
import { useTranslation } from "react-i18next";

export enum COMPARE_RESULT {
  SAME = "SAME",
  DIFF = "DIFF",
  FIRST_HAVE = "FIRST_HAVE",
  SECOND_HAVE = "SECOND_HAVE",
}

const CompareSnapshot: React.FC = () => {
  const { t } = useTranslation();
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
      name: t("name"),
      link: "/",
    },
    {
      name: t("snapshot:configSnapshot"),
      link: "/config/snapshot",
    },
    {
      name: id || "",
      link: "/config/snapshot/detail/" + id,
    },
    {
      name: t("snapshot:compare.name"),
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

  const compare = (obj1: any, obj2: any): any => {
    const result: any = {};
    for (const key in obj1) {
      result[key] = {};
      result[key]["show"] = false;
      result[key]["showLeft"] = false;
      result[key]["showRight"] = false;
      if (typeof obj2[key] === "object" && typeof obj1[key] === "object") {
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
        <HeaderPanel title={t("snapshot:compare.headTitle")}>
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
                    placeholder={t("snapshot:compare.selectSnapshot")}
                    onChange={(event) => {
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
                      placeholder={t("snapshot:compare.selectSnapshot")}
                      onChange={(event) => {
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
                  />
                  {t("snapshot:compare.showDiffOnly")}
                </label>
              </div>
              <div className="mt-10 version-compare">
                {loadingChangeSnapshot ? (
                  <LoadingText />
                ) : (
                  <div>
                    <table className="compare" width="100%">
                      <thead>
                        <tr>
                          <th style={{ width: 200 }}>
                            {t("snapshot:compare.configSection")}
                          </th>
                          <th align="center">
                            <div className="text-center">
                              {t("snapshot:compare.snapshot")} {leftSnapshot}
                            </div>
                          </th>
                          <th align="center">
                            <div className="text-center">
                              {t("snapshot:compare.snapshot")} {rightSnapshot}
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
                                          {t("snapshot:compare.same")}
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
                                              <b>
                                                {t("snapshot:compare.show")}
                                              </b>
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
                                              <b>
                                                {t("snapshot:compare.hide")}
                                              </b>
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
                                        {t("snapshot:compare.diff")}
                                        <SwapHorizontalCircleIcon />
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
                                            <b>{t("snapshot:compare.show")}</b>
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
                                            <b>{t("snapshot:compare.hide")}</b>
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
                                            <b>{t("snapshot:compare.show")}</b>
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
                                            <b>{t("snapshot:compare.hide")}</b>
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
                                            <b>{t("snapshot:compare.show")}</b>
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
                                            <b>{t("snapshot:compare.hide")}</b>
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
