import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { Pagination } from "@material-ui/lab";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useNavigate, useParams } from "react-router-dom";
import TextInput from "components/TextInput";
import Modal from "components/Modal";
import FormItem from "components/FormItem";
import MultiSelect from "components/MultiSelect";
import { Snapshot } from "API";
import { appSyncRequestMutation, appSyncRequestQuery } from "assets/js/request";
import {
  getAppliedSnapshotName,
  getConfigSnapshotContent,
  getDistributionCname,
  listCloudfrontSnapshots,
  listDistribution,
} from "graphql/queries";
import LoadingText from "../../../components/LoadingText";
import TextArea from "../../../components/TextArea";
import {
  applySnapshot,
  createVersionSnapShot,
  deleteSnapshot,
} from "../../../graphql/mutations";
import Swal from "sweetalert2";
import HeaderPanel from "../../../components/HeaderPanel";
import ValueWithLabel from "../../../components/ValueWithLabel";
import ButtonDropdown from "components/ButtonDropdown";

const SnapshotDetail: React.FC = () => {
  const navigate = useNavigate();
  const [snapshotFilterList, setSnapshotFilterList] = useState<Snapshot[]>([]);
  const [snapshotList, setSnapshotList] = useState<Snapshot[]>([]);
  const [snapshotWithNotesList, setSnapshotWithNotesList] = useState<
    Snapshot[]
  >([]);
  const [distributionList, setDistributionList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<Snapshot[]>([]);
  const [applyDisabled, setApplyDisabled] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [deleteDisabled, setDeleteDisabled] = useState(false);
  const [compareDisabled, setCompareDisabled] = useState(false);
  const [compareWithCurrentDisabled, setCompareWithCurrentDisabled] =
    useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [snapshotModal, setSnapshotModal] = useState(false);
  const [selectDistribution, setSelectDistribution] = useState<any>([]);
  const [confirm, setConfirm] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [snapShotName, setSnapShotName] = useState<any>("");
  const [bindingSnapShotName, setBindingSnapShotName] = useState<any>("");
  const [snapShotNote, setSnapShotNote] = useState<any>("");
  const [distributionId, setDistributionId] = useState<any>("");
  const [isDrifting, setIsDrifting] = useState<any>("NO");
  const [driftingCompareDisable, setDriftingCompareDisable] =
    useState<any>(true);
  const [distributionAliases, setDistributionAliases] = useState<string[]>([]);
  const { id } = useParams();
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
    },
  ];

  // Get Snapshot List By Distribution
  const getSnapshotListByDistribution = async () => {
    try {
      setDistributionId(id || "");
      setLoadingData(true);
      setSnapshotList([]);
      const resData = await appSyncRequestQuery(listCloudfrontSnapshots, {
        distribution_id: id,
      });
      const snapshotList: Snapshot[] = resData.data.listCloudfrontSnapshots;
      const snapshotWithoutLatest: Snapshot[] = snapshotList.filter(
        (snapshot) => snapshot.snapshot_name != "_LATEST_"
      );
      setLoadingData(false);
      setSnapshotList(snapshotWithoutLatest);
      setSnapshotFilterList(snapshotWithoutLatest);
      setSnapshotWithNotesList(snapshotWithoutLatest);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getSnapshotListByDistribution();
  }, []);

  // Get Snapshot List By Distribution
  const getDistributionList = async () => {
    try {
      setDistributionList([]);
      const resData = await appSyncRequestQuery(listDistribution);
      const Cloudfront_info_list: any[] = resData.data.listDistribution;
      const tmpList = [];
      for (const cfdistlistKey in Cloudfront_info_list) {
        const cname =
          Cloudfront_info_list[cfdistlistKey].aliases.Quantity === 0
            ? ""
            : Cloudfront_info_list[cfdistlistKey].aliases.Items[0];
        tmpList.push({
          name: Cloudfront_info_list[cfdistlistKey].id + " | " + cname,
          value: Cloudfront_info_list[cfdistlistKey].id,
        });
      }
      setDistributionList(tmpList);
    } catch (error) {
      console.error(error);
    }
  };

  // get alias by Distribution
  const getCloudfrontAliases = async () => {
    try {
      const resData = await appSyncRequestQuery(getDistributionCname, {
        distribution_id: id,
      });
      const result: string[] = resData.data.getDistributionCname;
      setDistributionAliases(result);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getCloudfrontAliases();
  }, []);

  // get alias by Distribution
  const getBindSnapshot = async () => {
    try {
      const resData = await appSyncRequestQuery(getAppliedSnapshotName, {
        distribution_id: id,
      });
      const snapshot: string = resData.data.getAppliedSnapshotName;
      setBindingSnapShotName(snapshot);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getBindSnapshot();
  }, []);

  // get Binding Snapshot drifting status
  const getBindSnapshotDriftStatus = async () => {
    if (
      bindingSnapShotName === "Not binding with any Snapshot" ||
      bindingSnapShotName === ""
    ) {
      setIsDrifting("NO");
      setDriftingCompareDisable(true);
      return;
    }

    try {
      const resDataCurrent = await appSyncRequestQuery(
        getConfigSnapshotContent,
        {
          distribution_id: id,
          snapshot_name: bindingSnapShotName,
        }
      );
      const bindSnapshotContent: string =
        resDataCurrent.data.getConfigSnapshotContent;

      const resDataLatest = await appSyncRequestQuery(
        getConfigSnapshotContent,
        {
          distribution_id: id,
          snapshot_name: "_LATEST_",
        }
      );
      const currentCloudfrontContent: string =
        resDataLatest.data.getConfigSnapshotContent;

      if (bindSnapshotContent === currentCloudfrontContent) {
        setIsDrifting("NO");
      } else {
        setIsDrifting("YES");
        setDriftingCompareDisable(false);
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getBindSnapshotDriftStatus();
  }, [bindingSnapShotName]);

  // Get Snapshot List By Distribution
  const applyCloudFrontSnapshot = async () => {
    try {
      //convert the selected dist list
      const targetDistList: string[] = [];
      for (const index in selectDistribution) {
        targetDistList.push(selectDistribution[index]);
      }

      const snapshotId = selectedItem[0].snapshot_name;

      setLoadingApply(true);
      const resData = await appSyncRequestMutation(applySnapshot, {
        src_distribution_id: id,
        snapshot_name: snapshotId,
        target_distribution_ids: targetDistList,
      });
      setLoadingApply(false);
      setOpenModal(false);
    } catch (error) {
      setLoadingApply(false);
      console.error(error);
    }
  };

  const selectAllDistributions = () => {
    const selectList: any = [];
    for (const index in distributionList) {
      selectList.push(distributionList[index].name);
    }
    setSelectDistribution(() => {
      return selectList;
    });
  };

  useEffect(() => {
    // console.info(selectDistribution);
  }, [selectDistribution]);

  const selectNoneDistributions = async () => {
    setSelectDistribution([]);
  };

  // Get Version List By Distribution
  const createSnapshotRequest = async () => {
    try {
      const resData = await appSyncRequestMutation(createVersionSnapShot, {
        distributionId,
        snapShotName,
        snapShotNote,
      });
    } catch (error) {
      console.error(error);
    }
  };
  // delete target snapshot
  const deleteSnapshotRequest = async () => {
    try {
      const resData = await appSyncRequestMutation(deleteSnapshot, {
        distributionId,
        snapShotName: selectedItem[0].snapshot_name,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedItem.length > 0) {
      if (selectedItem.length === 1) {
        setApplyDisabled(false);
        setSaveDisabled(false);
        setDeleteDisabled(false);
        setCompareDisabled(true);
        setCompareWithCurrentDisabled(false);
      } else if (selectedItem.length === 2) {
        setApplyDisabled(true);
        setSaveDisabled(true);
        setDeleteDisabled(true);
        setCompareDisabled(false);
        setCompareWithCurrentDisabled(true);
      } else {
        setApplyDisabled(true);
        setSaveDisabled(true);
        setCompareDisabled(true);
        setCompareWithCurrentDisabled(true);
      }
    } else {
      setApplyDisabled(true);
      setSaveDisabled(true);
      setCompareDisabled(true);
      setCompareWithCurrentDisabled(true);
    }
  }, [selectedItem]);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        {/*<HeaderPanel*/}
        {/*  title={*/}
        {/*    distributionId + "(" + (distributionAliases[0] || "No CNAME") + ")"*/}
        {/*  }*/}
        {/*>*/}
        {/*  <div className="flex value-label-span">*/}
        {/*    <div className="flex-1">*/}
        {/*      <ValueWithLabel label="Applied Snapshot Name">*/}
        {/*        <div>*/}
        {/*          {bindingSnapShotName == ""*/}
        {/*            ? "Not binding with any Snapshot"*/}
        {/*            : bindingSnapShotName}*/}
        {/*        </div>*/}
        {/*      </ValueWithLabel>*/}
        {/*    </div>*/}
        {/*    <div className="flex-1 border-left-c">*/}
        {/*      <ValueWithLabel label="Drifting from applied Snapshot?">*/}
        {/*        <div>{isDrifting}</div>*/}
        {/*      </ValueWithLabel>*/}
        {/*      <ValueWithLabel label="Diff with applied Snapshot">*/}
        {/*        <div>*/}
        {/*          <Button*/}
        {/*            btnType="primary"*/}
        {/*            disabled={driftingCompareDisable}*/}
        {/*            onClick={() => {*/}
        {/*              const path =*/}
        {/*                "/config/snapshot/detail/" +*/}
        {/*                id +*/}
        {/*                "/compare/" +*/}
        {/*                bindingSnapShotName +*/}
        {/*                "/" +*/}
        {/*                "_LATEST_";*/}
        {/*              navigate(path);*/}
        {/*            }}*/}
        {/*          >*/}
        {/*            Compare with Applied Snapshot*/}
        {/*          </Button>*/}
        {/*        </div>*/}
        {/*      </ValueWithLabel>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</HeaderPanel>*/}
        <HeaderPanel title={distributionId}>
          <div className="flex value-label-span">
            <ValueWithLabel label="CNAME">
              <div>
                <div className="flex-1">
                  {distributionAliases[0] || "No CNAME"}
                </div>
              </div>
            </ValueWithLabel>
          </div>
        </HeaderPanel>
        <TablePanel
          loading={loadingData}
          title="Snapshot List"
          selectType={SelectType.CHECKBOX}
          actions={
            <div>
              <Button
                onClick={() => {
                  getSnapshotListByDistribution();
                }}
              >
                {loadingData ? (
                  <LoadingText />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </Button>

              <ButtonDropdown
                style={{ minWidth: 220 }}
                items={[
                  {
                    id: "compareCurrent",
                    text: "Compare with current Config",
                    disabled: compareWithCurrentDisabled,
                  },
                  { id: "compare", text: "Compare", disabled: compareDisabled },
                  {
                    id: "updateNote",
                    text: "Update Description",
                    disabled: saveDisabled,
                  },
                  {
                    id: "applyOther",
                    text: "Apply to other distributions",
                    disabled: applyDisabled,
                  },
                  { id: "delete", text: "Delete", disabled: saveDisabled },
                ]}
                className="drop-down"
                // disabled={pipelineInfo?.status !== PipelineStatus.ACTIVE}
                onItemClick={(item) => {
                  if (item.id === "delete") {
                    setLoadingApply(true);
                    deleteSnapshotRequest();
                    setLoadingApply(false);
                    getSnapshotListByDistribution();
                    Swal.fire(
                      "Cloudfront snapshot deleted",
                      "Cloudfront snapshot deleted",
                      "success"
                    );
                  }
                  if (item.id === "compareCurrent") {
                    const path =
                      "/config/snapshot/detail/" +
                      id +
                      "/compare/" +
                      selectedItem[0].snapshot_name +
                      "/" +
                      "_LATEST_";
                    navigate(path);
                  }
                  if (item.id === "compare") {
                    const path =
                      "/config/snapshot/detail/" +
                      id +
                      "/compare/" +
                      selectedItem[0].snapshot_name +
                      "/" +
                      selectedItem[1].snapshot_name;
                    navigate(path);
                  }
                  if (item.id === "applyOther") {
                    setOpenModal(true);
                    getDistributionList();
                  }
                  if (item.id === "updateNote") {
                    const path =
                      "/config/snapshot/detail/" +
                      id +
                      "/" +
                      selectedItem[0].snapshot_name +
                      "/save" +
                      "/" +
                      selectedItem[0].note;
                    navigate(path);
                  }
                }}
              >
                Actions
              </ButtonDropdown>

              <Button
                btnType="primary"
                onClick={() => {
                  setSnapshotModal(true);
                }}
              >
                Create Snapshot
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={snapshotFilterList}
          columnDefinitions={[
            {
              width: 150,
              id: "snapShotName",
              header: "Snapshot Name",
              cell: (e: Snapshot) => {
                const path =
                  "/config/snapshot/detail/display/" +
                  id +
                  "/" +
                  e.snapshot_name;
                return <a href={path}>{e.snapshot_name}</a>;
              },
            },
            {
              width: 200,
              id: "date",
              header: "Date",
              cell: (e: Snapshot) => e.dateTime,
            },
            // {
            //   id: "s3key",
            //   header: "S3 Key",
            //   cell: (e: Snapshot) => e.s3_key,
            // },
            {
              // width: 200,
              id: "tags",
              header: "Description",
              cell: (e: Snapshot) => e.note,
            },
          ]}
          // filter={
          //   <div>
          //     <TextInput
          //       value={searchParams}
          //       isSearch={true}
          //       placeholder={"Search all snapshots"}
          //       onChange={(event) => {
          //         console.info("event:", event);
          //         setSearchParams(event.target.value);
          //       }}
          //     />
          //   </div>
          // }
          changeSelected={(item) => {
            setSelectedItem(item);
          }}
        />
      </div>
      <Modal
        title="Apply Settings?"
        isOpen={openModal}
        fullWidth={true}
        closeModal={() => {
          setOpenModal(false);
        }}
        actions={
          <div className="button-action no-pb text-right">
            <Button
              onClick={() => {
                setConfirm("");
                setOpenModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={confirm !== "Confirm"}
              btnType="primary"
              loading={loadingApply}
              onClick={() => {
                applyCloudFrontSnapshot();
              }}
            >
              Apply
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <FormItem
            optionTitle="Distribution"
            optionDesc="Distribution to apply configurations"
          >
            <div className="flex">
              <div style={{ width: 800 }}>
                <MultiSelect
                  optionList={distributionList}
                  value={selectDistribution}
                  placeholder="Select distribution"
                  onChange={(items) => {
                    setSelectDistribution(items);
                  }}
                />
              </div>
              <div className="ml-5">
                <Button
                  onClick={() => {
                    selectAllDistributions();
                  }}
                >
                  Select all
                </Button>
              </div>
              <div className="ml-5">
                <Button
                  onClick={() => {
                    selectNoneDistributions();
                  }}
                >
                  Select None
                </Button>
              </div>
            </div>
          </FormItem>
          <FormItem optionTitle="" optionDesc="Please input Confirm to apply">
            <TextInput
              value={confirm}
              placeholder="Confirm"
              onChange={(event) => {
                setConfirm(event.target.value);
              }}
            />
          </FormItem>
        </div>
      </Modal>
      <Modal
        title="Create new Cloudfront Snapshot"
        isOpen={snapshotModal}
        fullWidth={true}
        closeModal={() => {
          setSnapshotModal(false);
        }}
        actions={
          <div className="button-action no-pb text-right">
            <Button
              onClick={() => {
                setConfirm("");
                setSnapshotModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                // startWorkflow();
                setLoadingApply(true);
                createSnapshotRequest();
                setLoadingApply(false);
                Swal.fire(
                  "Cloudfront snapshot created",
                  "Cloudfront snapshot created",
                  "success"
                );
                setSnapshotModal(false);
                getSnapshotListByDistribution();
              }}
            >
              Create
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <FormItem optionTitle="Distribution" optionDesc="">
            <TextInput
              disabled
              value={id || ""}
              onChange={(event) => {
                // console.info("test");
              }}
            />
          </FormItem>
          <FormItem optionTitle="Snapshot Name" optionDesc="">
            <TextArea
              placeholder="Snapshot Name"
              rows={1}
              value={snapShotName}
              onChange={(event) => {
                setSnapShotName(event.target.value);
              }}
            />
          </FormItem>
          <FormItem optionTitle="Description" optionDesc="">
            <TextArea
              placeholder="Description"
              rows={2}
              value={snapShotNote || ""}
              onChange={(event) => {
                setSnapShotNote(event.target.value);
              }}
            />
          </FormItem>
        </div>
      </Modal>
    </div>
  );
};

export default SnapshotDetail;
