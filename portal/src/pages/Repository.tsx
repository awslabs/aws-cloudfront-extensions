import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { Pagination } from "@material-ui/lab";
import { useNavigate } from "react-router-dom";
import { Extension, ExtensionType } from "API";
import { appSyncRequestMutation, appSyncRequestQuery } from "assets/js/request";
import { checkSyncStatus, listExtensions, queryByName } from "graphql/queries";
import { deployExtension, syncExtensions } from "graphql/mutations";
import Swal from "sweetalert2";
import Modal from "components/Modal";
import { useTranslation } from "react-i18next";

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
  const [extentionList, setExtentionList] = useState<Extension[]>([]);
  const [curPage, setCurPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedExtension, setSelectedExtension] = useState<Extension>();
  const [deployDisabled, setDeployDisabled] = useState(true);
  // const [cur, setcur] = useState(second)
  const { t } = useTranslation();

  const BreadCrunbList = [
    {
      name: t("menu.home"),
      link: "/",
    },
    {
      name: t("menu.repository"),
      link: "",
    },
  ];

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
          t("repository:update.upToDate"),
          t("repository:update.upToDateDesc"),
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

    setLoadingQuery(false);
    if (
      !resData.data.queryByName.cfnParameter &&
      resData.data.queryByName.type === ExtensionType.Lambda
    ) {
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
          title={t("repository:title")}
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
                {t("button.checkUpdate")}
              </Button>
              <Button
                loading={loadingQuery}
                disabled={deployDisabled}
                btnType="primary"
                onClick={() => {
                  beforeToDeploy();
                }}
              >
                {t("button.deploy")}
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
              width: 200,
              id: "name",
              header: t("repository:list.name"),
              cell: (e: Extension) => e.name,
            },
            {
              id: "desc",
              header: t("repository:list.desc"),
              cell: (e: Extension) => e.desc,
            },
            {
              width: 160,
              id: "stage",
              header: t("repository:list.stage"),
              cell: (e: Extension) => e.stage,
            },
            {
              width: 50,
              id: "details",
              header: t("repository:list.details"),
              cell: (e: Extension) => {
                return e.codeUri ? (
                  <a href={e.codeUri} target="_blank" rel="noreferrer">
                    {t("repository:list.link")}
                  </a>
                ) : (
                  "-"
                );
              },
            },
            {
              width: 200,
              id: "updated",
              header: t("repository:list.updated"),
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
        title={t("repository:update.updateExt")}
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
              {t("button.cancel")}
            </Button>
            <Button
              loading={loadingSync}
              btnType="primary"
              onClick={() => {
                syncLatestExtension();
              }}
            >
              {t("button.update")}
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          {t("repository:update.newVersion")}
        </div>
      </Modal>

      <Modal
        title={t("repository:deploy.deployExt")}
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
              {t("button.cancel")}
            </Button>
            <Button
              loading={loadingDeploy}
              btnType="primary"
              onClick={() => {
                startToDeployExtentsion();
              }}
            >
              {t("button.deploy")}
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          {t("repository:delete.deleteTips")}
          <b>{selectedExtension?.name}</b> ?
        </div>
      </Modal>
    </div>
  );
};

export default Repository;
