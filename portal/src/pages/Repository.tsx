import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { Pagination } from "@material-ui/lab";
import { useNavigate } from "react-router-dom";
import TextInput from "components/TextInput";
import { Extension, ExtensionType } from "API";
import { appSyncRequestMutation, appSyncRequestQuery } from "assets/js/request";
import { checkSyncStatus, listExtensions, queryByName } from "graphql/queries";
import { deployExtension, syncExtensions } from "graphql/mutations";
import Swal from "sweetalert2";
import Modal from "components/Modal";

const BreadCrunbList = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "Extensions repository",
    link: "",
  },
];

const PAGE_SIZE = 10;

const Repository: React.FC = () => {
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingDeploy, setLoadingDeploy] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openDeployModal, setOpenDeployModal] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [extentionList, setExtentionList] = useState<Extension[]>([]);
  const [curPage, setCurPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedExtension, setSelectedExtension] = useState<Extension>();
  const [deployDisabled, setDeployDisabled] = useState(true);
  // const [cur, setcur] = useState(second)

  // Get Extension List
  const getExtensionList = async () => {
    setExtentionList([]);
    try {
      setLoadingData(true);
      setExtentionList([]);
      const resData = await appSyncRequestQuery(listExtensions, {
        page: curPage,
        count: PAGE_SIZE,
      });
      if (resData.data.listExtensions) {
        const extList: Extension[] = resData.data.listExtensions.extension;
        setTotalCount(resData.data.listExtensions.total);
        setExtentionList(extList);
      }
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  // Check Update Extenstion
  const checkExtensionUpdate = async () => {
    try {
      setLoadingCheck(true);
      const resData = await appSyncRequestMutation(checkSyncStatus, {});
      if (resData.data.checkSyncStatus === "true") {
        console.info("need update");
        setOpenModal(true);
      } else {
        Swal.fire(
          "Up to date",
          "All your extenstions are up to date",
          "success"
        );
      }
      setLoadingCheck(false);
    } catch (error) {
      setLoadingCheck(false);
      console.error(error);
    }
  };

  // Sync Extensions
  const syncLatestExtension = async () => {
    try {
      setLoadingSync(true);
      setExtentionList([]);
      const resData = await appSyncRequestMutation(syncExtensions, {});
      if (resData) {
        setLoadingSync(false);
        getExtensionList();
        setOpenModal(false);
      }
    } catch (error) {
      setLoadingSync(false);
      console.error(error);
    }
  };

  const handlePageChange = (event: any, value: number) => {
    console.info("event:", event);
    console.info("value:", value);
    setCurPage(value);
  };

  const beforeToDeploy = async () => {
    setLoadingQuery(true);
    const resData = await appSyncRequestQuery(queryByName, {
      name: selectedExtension?.name,
    });
    console.info("resData:", resData);

    setLoadingQuery(false);
    if (
      !resData.data.queryByName.cfnParameter &&
      resData.data.queryByName.type === ExtensionType.Lambda
    ) {
      console.info("show deploy modal");
      setOpenDeployModal(true);
    } else {
      navigate(`/extentions/deploy/${selectedExtension?.name}`);
    }
  };

  const startToDeployExtentsion = async () => {
    const deployParams = {
      name: selectedExtension?.name,
      parameters: [],
    };
    try {
      setLoadingDeploy(true);
      const resData = await appSyncRequestMutation(
        deployExtension,
        deployParams
      );
      setLoadingDeploy(false);
      setOpenDeployModal(false);
      if (resData.data.deployExtension) {
        navigate(
          `/extentions/deploy/${selectedExtension?.name}/success?stackLink=${resData.data.deployExtension}`
        );
      }
    } catch (error) {
      setOpenDeployModal(false);
      setLoadingDeploy(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getExtensionList();
  }, [curPage]);

  useEffect(() => {
    console.info("selectedExtension:", selectedExtension);
    if (selectedExtension) {
      setDeployDisabled(false);
    } else {
      setDeployDisabled(true);
    }
  }, [selectedExtension]);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          loading={loadingData}
          title="Extensions"
          selectType={SelectType.RADIO}
          actions={
            <div>
              <Button
                disabled={loadingData}
                loading={loadingCheck}
                loadingColor="#888"
                onClick={() => {
                  checkExtensionUpdate();
                }}
              >
                Check Updates
              </Button>
              <Button
                loading={loadingQuery}
                disabled={deployDisabled}
                btnType="primary"
                onClick={() => {
                  beforeToDeploy();
                }}
              >
                Deploy
              </Button>
            </div>
          }
          pagination={
            <Pagination
              disabled={loadingData}
              count={Math.ceil(totalCount / PAGE_SIZE)}
              page={curPage}
              onChange={handlePageChange}
            />
          }
          items={extentionList}
          columnDefinitions={[
            {
              width: 250,
              id: "name",
              header: "Name",
              cell: (e: Extension) => e.name,
            },
            {
              id: "desc",
              header: "Description",
              cell: (e: Extension) => e.desc,
            },
            {
              width: 160,
              id: "stage",
              header: "CloudFront Stage",
              cell: (e: Extension) => e.stage,
            },
            {
              width: 200,
              id: "updated",
              header: "Updated",
              cell: (e: Extension) => e.updateDate,
            },
          ]}
          // filter={
          //   <div>
          //     <TextInput
          //       value={searchParams}
          //       isSearch={true}
          //       placeholder={"Search all extentions"}
          //       onChange={(event) => {
          //         console.info("event:", event);
          //         setSearchParams(event.target.value);
          //       }}
          //     />
          //   </div>
          // }
          changeSelected={(item) => {
            if (item.length > 0) {
              setSelectedExtension(item[0]);
            }
          }}
        />
      </div>
      <Modal
        title="Update Extenstions"
        isOpen={openModal}
        fullWidth={false}
        closeModal={() => {
          setOpenModal(false);
        }}
        actions={
          <div className="button-action no-pb text-right">
            <Button
              onClick={() => {
                setOpenModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={loadingSync}
              btnType="primary"
              onClick={() => {
                syncLatestExtension();
              }}
            >
              Update
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          A newer version of the extensions were detected, are you sure you need
          to update all extenstions?
        </div>
      </Modal>

      <Modal
        title="Deploy Extensions"
        isOpen={openDeployModal}
        fullWidth={false}
        closeModal={() => {
          setOpenModal(false);
        }}
        actions={
          <div className="button-action no-pb text-right">
            <Button
              onClick={() => {
                setOpenDeployModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={loadingDeploy}
              btnType="primary"
              onClick={() => {
                startToDeployExtentsion();
              }}
            >
              Deploy
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          Are you sure you want to deploy the extention{" "}
          <b>{selectedExtension?.name}</b> ?
        </div>
      </Modal>
    </div>
  );
};

export default Repository;
