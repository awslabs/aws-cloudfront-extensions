import React, { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import PauseCircleFilledIcon from "@material-ui/icons/PauseCircleFilled";
import SwapHorizontalCircleIcon from "@material-ui/icons/SwapHorizontalCircle";
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
import LoadingText from "components/LoadingText";

export enum COMPARE_RESULT {
  SAME = "SAME",
  DIFF = "DIFF",
  FIRST_HAVE = "FIRST_HAVE",
  SECOND_HAVE = "SECOND_HAVE",
}

const CompareVersion: React.FC = () => {
  const { id } = useParams();
  const { ver1 } = useParams();
  const { ver2 } = useParams();
  const [leftVersion, setLeftVersion] = useState<any>(ver1);
  const [rightVersion, setRightVersion] = useState<any>(ver2);
  const [leftContent, setLeftContent] = useState<any>("");
  const [rightContent, setRightContent] = useState<any>("");
  const [versionList, setVersionList] = useState<any[]>([]);
  const [versionDiffRes, setVersionDiffRes] = useState<any>({});
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [loadingChangeVersion, setLoadingChangeVersion] = useState(false);

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
      name: id || "",
      link: "/config/version/detail/" + id,
    },
    {
      name: "Compare",
    },
  ];

  useEffect(() => {
    getVersionListByDistribution();
  }, []);

  // Get Left Version By Distribution
  const getLeftVersionContent = async () => {
    setLoadingChangeVersion(true);
    try {
      const resData = await appSyncRequestQuery(getConfigContent, {
        distribution_id: id,
        versionId: leftVersion,
      });
      setLeftContent(resData.data.getConfigContent);
      setLoadingChangeVersion(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Get Right Version By Distribution
  const getRightVersionContent = async () => {
    setLoadingChangeVersion(true);
    try {
      const resData = await appSyncRequestQuery(getConfigContent, {
        distribution_id: id,
        versionId: rightVersion,
      });
      setRightContent(resData.data.getConfigContent);
      setLoadingChangeVersion(false);
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
        const obj1Str = JSON.stringify(obj1[key]);
        const obj2Str = JSON.stringify(obj2[key]);
        if (obj1Str !== obj2Str) {
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
    // Loop through the fisrt object and find missing items in object2
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
      setVersionDiffRes(res);
    }
  }, [leftContent, rightContent]);

  const showConfigDetail = (
    key: string,
    type: COMPARE_RESULT,
    show: boolean
  ) => {
    console.info("show:", show);
    const tmpCompareRes = JSON.parse(JSON.stringify(versionDiffRes));
    if (type === COMPARE_RESULT.SAME || type === COMPARE_RESULT.DIFF) {
      tmpCompareRes[key].show = show;
    }
    if (type === COMPARE_RESULT.FIRST_HAVE) {
      tmpCompareRes[key].showLeft = show;
    }
    if (type === COMPARE_RESULT.SECOND_HAVE) {
      tmpCompareRes[key].showRight = show;
    }
    setVersionDiffRes(tmpCompareRes);
  };

  // Get Version List By Distribution
  const getVersionListByDistribution = async () => {
    setLoadingDistribution(true);
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
        <HeaderPanel title="Please select the version to compare">
          {loadingDistribution ? (
            <LoadingText />
          ) : (
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
                      }}
                    />
                  </div>
                  {/*<Button btnType="primary">Compare</Button>*/}
                </div>
              </div>
              <div className="mt-10 version-compare">
                {loadingChangeVersion ? (
                  <LoadingText />
                ) : (
                  <div>
                    <table className="compare" width="100%">
                      <thead>
                        <tr>
                          <th style={{ width: 200 }}>Config Section</th>
                          <th align="center">
                            <div className="text-center">
                              Version {leftVersion}
                            </div>
                          </th>
                          <th align="center">
                            <div className="text-center">
                              Version {rightVersion}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(versionDiffRes).map((key) => {
                          return (
                            <>
                              {versionDiffRes[key].res ===
                                COMPARE_RESULT.SAME && (
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
                                        {!versionDiffRes[key].show && (
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
                                        {versionDiffRes[key].show && (
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
                                    {versionDiffRes[key].show && (
                                      <div className="text-left bg-gray">
                                        <pre>
                                          {JSON.stringify(
                                            versionDiffRes[key].data,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                              {versionDiffRes[key].res ===
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
                                        {!versionDiffRes[key].show && (
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
                                        {versionDiffRes[key].show && (
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
                                    {versionDiffRes[key].show && (
                                      <div>
                                        <ReactDiffViewer
                                          oldValue={JSON.stringify(
                                            versionDiffRes[key].data1,
                                            null,
                                            2
                                          )}
                                          newValue={JSON.stringify(
                                            versionDiffRes[key].data2,
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

                              {versionDiffRes[key].res ===
                                COMPARE_RESULT.FIRST_HAVE && (
                                <tr key={key}>
                                  <td>
                                    <div className="key">{key}</div>
                                  </td>
                                  <td align="center">
                                    <div>
                                      <span className="show-btn">
                                        (
                                        {!versionDiffRes[key].showLeft && (
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
                                        {versionDiffRes[key].showLeft && (
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
                                    {versionDiffRes[key].showLeft && (
                                      <div className="text-left bg-gray">
                                        <pre>
                                          {JSON.stringify(
                                            versionDiffRes[key].data1,
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

                              {versionDiffRes[key].res ===
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
                                        {!versionDiffRes[key].showRight && (
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
                                        {versionDiffRes[key].showRight && (
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
                                    {versionDiffRes[key].showRight && (
                                      <div className="text-left bg-gray">
                                        <pre>
                                          {JSON.stringify(
                                            versionDiffRes[key].data1,
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

export default CompareVersion;
