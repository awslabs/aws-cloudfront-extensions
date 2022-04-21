import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
// import { CF_LIST, MOCK_VERSION_LIST, VersionType } from "mock/data";
import { Pagination } from "@material-ui/lab";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useNavigate, useParams } from "react-router-dom";
import TextInput from "components/TextInput";
import Modal from "components/Modal";
import FormItem from "components/FormItem";
import MultiSelect from "components/MultiSelect";
import { Version } from "API";
import { appSyncRequestQuery } from "assets/js/request";
import { listCloudfrontVersions } from "graphql/queries";
import { CF_LIST } from "mock/data";

const VersionDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState("");
  const [versionList, setVersionList] = useState<Version[]>([]);
  const [selectedItem, setSelectedItem] = useState<Version[]>([]);
  const [applyDisabled, setApplyDisabled] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [detailDisabled, setDetailDisabled] = useState(false);
  const [compareDisabled, setCompareDisabled] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  // const [distributionList, setDistributionList] = useState<any>([]);
  const [selectDestribution, setSelectDestribution] = useState<any>([]);
  const [confirm, setConfirm] = useState("");
  const [loadingData, setLoadingData] = useState(false);
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
      setLoadingData(false);
      setVersionList(versionList);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getVersionListByDistribution();
  }, []);

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
              <Button>
                <RefreshIcon fontSize="small" />
              </Button>
              <Button
                disabled={applyDisabled}
                onClick={() => {
                  setOpenModal(true);
                }}
              >
                Apply
              </Button>
              <Button
                disabled={saveDisabled}
                onClick={() => {
                  navigate("/config/vesrsion/detail/XLOWCQQFJJHM80/save");
                }}
              >
                Save
              </Button>
              <Button
                disabled={detailDisabled}
                onClick={() => {
                  navigate("/404");
                }}
              >
                Details
              </Button>
              <Button
                disabled={compareDisabled}
                btnType="primary"
                onClick={() => {
                  navigate("/config/vesrsion/detail/XLOWCQQFJJHM80/compare");
                }}
              >
                Compare
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={versionList}
          columnDefinitions={[
            {
              width: 150,
              id: "id",
              header: "Version Id",
              cell: (e: Version) => {
                return <a href="/404">{e.versionId}</a>;
              },
            },
            {
              width: 180,
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
              width: 200,
              id: "tags",
              header: "Tags",
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
        fullWidth={false}
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
              onClick={() => {
                setOpenModal(false);
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
              <div style={{ width: 500 }}>
                <MultiSelect
                  optionList={CF_LIST}
                  value={selectDestribution}
                  placeholder="Select distribution"
                  onChange={(items) => {
                    setSelectDestribution(items);
                  }}
                />
              </div>
              <div className="ml-10">
                <Button>Select all</Button>
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
