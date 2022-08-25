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
import { useTranslation } from "react-i18next";

const SnapshotDetail: React.FC = () => {
  const navigate = useNavigate();
  const [snapshotFilterList, setSnapshotFilterList] = useState<Snapshot[]>([]);
  const [distributionList, setDistributionList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<Snapshot[]>([]);
  const [applyDisabled, setApplyDisabled] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(false);
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
  const [snapShotNote, setSnapShotNote] = useState<any>("");
  const [distributionId, setDistributionId] = useState<any>("");
  const [distributionAliases, setDistributionAliases] = useState<string[]>([]);
  const { id } = useParams();
  const { t } = useTranslation();
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
    },
  ];

  // Get Snapshot List By Distribution
  const getSnapshotListByDistribution = async () => {
    try {
      setDistributionId(id || "");
      setSnapshotFilterList([]);
      setLoadingData(true);
      const resData = await appSyncRequestQuery(listCloudfrontSnapshots, {
        distribution_id: id,
      });
      const snapshotList: Snapshot[] = resData.data.listCloudfrontSnapshots;
      const snapshotWithoutLatest: Snapshot[] = snapshotList.filter(
        (snapshot) => snapshot.snapshot_name != "_LATEST_"
      );
      setLoadingData(false);
      setSnapshotFilterList(snapshotWithoutLatest);
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
      await appSyncRequestMutation(applySnapshot, {
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
        setCompareDisabled(true);
        setCompareWithCurrentDisabled(false);
      } else if (selectedItem.length === 2) {
        setApplyDisabled(true);
        setSaveDisabled(true);
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
            <ValueWithLabel label={t("snapshot:list.cname")}>
              <div>
                <div className="flex-1">
                  {distributionAliases[0] || t("noCname")}
                </div>
              </div>
            </ValueWithLabel>
          </div>
        </HeaderPanel>
        <TablePanel
          loading={loadingData}
          title={t("snapshot:list.snapshotList")}
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
                    text: t("snapshot:detail.action.compareCurrent"),
                    disabled: compareWithCurrentDisabled,
                  },
                  {
                    id: "compare",
                    text: t("snapshot:detail.action.compare"),
                    disabled: compareDisabled,
                  },
                  {
                    id: "updateNote",
                    text: t("snapshot:detail.action.updateDesc"),
                    disabled: saveDisabled,
                  },
                  {
                    id: "applyOther",
                    text: t("snapshot:detail.action.applyOther"),
                    disabled: applyDisabled,
                  },
                  {
                    id: "delete",
                    text: t("snapshot:detail.action.delete"),
                    disabled: saveDisabled,
                  },
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
                      t("snapshot:detail.action.deleteTip"),
                      t("snapshot:detail.action.deleteTip"),
                      "success"
                    );
                    getSnapshotListByDistribution();
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
                {t("button.actions")}
              </ButtonDropdown>

              <Button
                btnType="primary"
                onClick={() => {
                  setSnapshotModal(true);
                }}
              >
                {t("button.createSnapshot")}
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={snapshotFilterList}
          columnDefinitions={[
            {
              width: 150,
              id: "snapShotName",
              header: t("snapshot:detail.item.name"),
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
              width: 300,
              id: "date",
              header: t("snapshot:detail.item.date"),
              cell: (e: Snapshot) => e.dateTime,
            },
            {
              // width: 200,
              id: "tags",
              header: t("snapshot:detail.item.desc"),
              cell: (e: Snapshot) => e.note,
            },
          ]}
          changeSelected={(item) => {
            setSelectedItem(item);
          }}
        />
      </div>
      <Modal
        title={t("snapshot:detail.applySetting")}
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
              {t("button.cancel")}
            </Button>
            <Button
              disabled={confirm !== "Confirm"}
              btnType="primary"
              loading={loadingApply}
              onClick={() => {
                applyCloudFrontSnapshot();
              }}
            >
              {t("button.apply")}
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <FormItem
            optionTitle={t("distribution")}
            optionDesc={t("snapshot:detail.applyConfig")}
          >
            <div className="flex">
              <div style={{ width: 800 }}>
                <MultiSelect
                  optionList={distributionList}
                  value={selectDistribution}
                  placeholder={t("snapshot:detail.selectDistribution")}
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
                  {t("button.selectAll")}
                </Button>
              </div>
              <div className="ml-5">
                <Button
                  onClick={() => {
                    selectNoneDistributions();
                  }}
                >
                  {t("button.selectNone")}
                </Button>
              </div>
            </div>
          </FormItem>
          <FormItem
            optionTitle=""
            optionDesc={t("snapshot:detail.confirmToApply")}
          >
            <TextInput
              value={confirm}
              placeholder={t("snapshot:detail.confirm")}
              onChange={(event) => {
                setConfirm(event.target.value);
              }}
            />
          </FormItem>
        </div>
      </Modal>
      <Modal
        title={t("snapshot:detail.createSnapshot")}
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
              {t("button.cancel")}
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                // startWorkflow();
                setLoadingApply(true);
                createSnapshotRequest();
                setLoadingApply(false);
                Swal.fire(
                  t("snapshot:detail.createTips"),
                  t("snapshot:detail.createTips"),
                  "success"
                );
                getSnapshotListByDistribution();
                setSnapshotModal(false);
                getSnapshotListByDistribution();
              }}
            >
              {t("button.create")}
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <FormItem optionTitle={t("distribution")} optionDesc="">
            <TextInput
              disabled
              value={id || ""}
              onChange={() => {
                // console.info("test");
              }}
            />
          </FormItem>
          <FormItem
            optionTitle={t("snapshot:detail.snapshotName")}
            optionDesc=""
          >
            <TextArea
              placeholder={t("snapshot:detail.snapshotName")}
              rows={1}
              value={snapShotName}
              onChange={(event) => {
                setSnapShotName(event.target.value);
              }}
            />
          </FormItem>
          <FormItem optionTitle={t("snapshot:detail.desc")} optionDesc="">
            <TextArea
              placeholder={t("snapshot:detail.desc")}
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
