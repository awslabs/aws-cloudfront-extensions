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
import { Cloudfront_info, Version } from "API";
import { appSyncRequestQuery } from "assets/js/request";
import {
  applyConfig,
  listCloudfrontVersions,
  listDistribution,
} from "graphql/queries";
import LoadingText from "../../../components/LoadingText";

const VersionDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState("");
  const [versionFilterList, setVersionFilterList] = useState<Version[]>([]);
  const [versionList, setVersionList] = useState<Version[]>([]);
  const [versionWithNotesList, setVersionWithNotesList] = useState<Version[]>(
    []
  );
  const [withNote, setWithNote] = useState(true);
  const [withNoteText, setWithNoteText] = useState("Version with note");
  const [distributionList, setDistributionList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<Version[]>([]);
  const [applyDisabled, setApplyDisabled] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [detailDisabled, setDetailDisabled] = useState(false);
  const [compareDisabled, setCompareDisabled] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectDistribution, setSelectDistribution] = useState<any>([]);
  const [confirm, setConfirm] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const { id } = useParams();
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
    },
  ];

  // Get Version List By Distribution
  const getVersionListByDistribution = async () => {
    try {
      setLoadingData(true);
      setVersionList([]);
      const resData = await appSyncRequestQuery(listCloudfrontVersions, {
        distribution_id: id,
      });
      const versionList: Version[] = resData.data.listCloudfrontVersions;
      const versionWithNoteList: Version[] = versionList.filter(
        (version) => version.note != ""
      );
      setLoadingData(false);
      setVersionList(versionList);
      setVersionFilterList(versionList);
      setVersionWithNotesList(versionWithNoteList);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getVersionListByDistribution();
  }, []);

  // Get Version List By Distribution
  const getDistributionList = async () => {
    try {
      setDistributionList([]);
      const resData = await appSyncRequestQuery(listDistribution);
      const Cloudfront_info_list: any[] = resData.data.listDistribution;
      const tmpList = [];
      console.log(Cloudfront_info_list);
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
      console.log(tmpList);
      setDistributionList(tmpList);
    } catch (error) {
      console.error(error);
    }
  };

  // Get Version List By Distribution
  const applyCloudFrontConfig = async () => {
    try {
      //convert the selected dist list
      const targetDistList: string[] = [];
      for (const index in selectDistribution) {
        targetDistList.push(selectDistribution[index]);
      }

      const versionId = selectedItem[0].versionId;

      setLoadingApply(true);
      const resData = await appSyncRequestQuery(applyConfig, {
        src_distribution_id: id,
        version: versionId,
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
    console.info(selectList);
    setSelectDistribution(() => {
      return selectList;
    });
  };

  useEffect(() => {
    console.info(selectDistribution);
  }, [selectDistribution]);

  const selectNoneDistributions = async () => {
    setSelectDistribution([]);
  };

  useEffect(() => {
    console.info("selectedItem:", selectedItem);
    if (selectedItem.length > 0) {
      if (selectedItem.length === 1) {
        setApplyDisabled(false);
        setSaveDisabled(false);
        setDetailDisabled(false);
        setCompareDisabled(true);
      } else if (selectedItem.length === 2) {
        setApplyDisabled(true);
        setSaveDisabled(true);
        setDetailDisabled(true);
        setCompareDisabled(false);
      } else {
        setApplyDisabled(true);
        setSaveDisabled(true);
        setDetailDisabled(true);
        setCompareDisabled(true);
      }
    } else {
      setApplyDisabled(true);
      setSaveDisabled(true);
      setDetailDisabled(true);
      setCompareDisabled(true);
    }
  }, [selectedItem]);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          loading={loadingData}
          title={id || ""}
          selectType={SelectType.CHECKBOX}
          actions={
            <div>
              <Button
                onClick={() => {
                  getVersionListByDistribution();
                }}
              >
                {loadingData ? (
                  <LoadingText />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </Button>
              <Button
                disabled={applyDisabled}
                onClick={() => {
                  setOpenModal(true);
                  getDistributionList();
                }}
              >
                Apply Config
              </Button>
              <Button
                disabled={saveDisabled}
                onClick={() => {
                  const path =
                    "/config/version/detail/" +
                    id +
                    "/" +
                    selectedItem[0].versionId +
                    "/save" +
                    "/" +
                    selectedItem[0].note;
                  navigate(path);
                }}
              >
                Update Version Notes
              </Button>
              <Button
                disabled={detailDisabled}
                onClick={() => {
                  const path =
                    "/config/version/detail/display/" +
                    id +
                    "/" +
                    selectedItem[0].versionId;
                  navigate(path);
                }}
              >
                Details
              </Button>
              <Button
                onClick={() => {
                  if (withNote) {
                    setVersionFilterList(versionWithNotesList);
                    setWithNoteText("All versions");
                    setWithNote(false);
                  } else {
                    setVersionFilterList(versionList);
                    setWithNoteText("Versions with note");
                    setWithNote(true);
                  }
                }}
              >
                {withNoteText}
              </Button>
              <Button
                disabled={compareDisabled}
                btnType="primary"
                onClick={() => {
                  const path =
                    "/config/version/detail/" +
                    id +
                    "/compare/" +
                    selectedItem[0].versionId +
                    "/" +
                    selectedItem[1].versionId;
                  navigate(path);
                }}
              >
                Compare
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={versionFilterList}
          columnDefinitions={[
            {
              // width: 150,
              id: "id",
              header: "Version Id",
              cell: (e: Version) => {
                const path =
                  "/config/version/detail/display/" + id + "/" + e.versionId;
                return <a href={path}>{e.versionId}</a>;
              },
            },
            {
              // width: 180,
              id: "date",
              header: "Date",
              cell: (e: Version) => e.dateTime,
            },
            {
              id: "s3key",
              header: "S3 Key",
              cell: (e: Version) => e.s3_key,
            },
            {
              // width: 200,
              id: "tags",
              header: "Version Notes",
              cell: (e: Version) => e.note,
            },
          ]}
          filter={
            <div>
              <TextInput
                value={searchParams}
                isSearch={true}
                placeholder={"Search all versions"}
                onChange={(event) => {
                  console.info("event:", event);
                  setSearchParams(event.target.value);
                }}
              />
            </div>
          }
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
                applyCloudFrontConfig();
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
    </div>
  );
};

export default VersionDetail;