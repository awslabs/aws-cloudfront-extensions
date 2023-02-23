import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import PagePanel from "components/PagePanel";
import HeaderPanel from "components/HeaderPanel";
import FormItem from "components/FormItem";
import Tiles from "components/Tiles";
import TextArea from "components/TextArea";
import Select from "components/Select";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";
import {
  appSyncRequestMutation,
  appSyncRequestQuery,
} from "../../../../assets/js/request";
import {
  listCloudfrontVersions,
  listDistribution,
} from "../../../../graphql/queries";
import { Version } from "../../../../API";
import { certCreateOrImport } from "../../../../graphql/mutations";
import Modal from "../../../../components/Modal";
import Swal from "sweetalert2";
import TextInput from "../../../../components/TextInput";
import { useTranslation } from "react-i18next";

// const enum ImportMethod {
//   CREATE = "create",
//   IMPORT = "import",
//   NONE = "NONE",
// }

const enum ImportCertificate {
  IMPORT_ONE = "ImportOne",
  IMPORT_MULTI = "ImportMulti",
}

interface CertInfo {
  body: string;
  privateKey: string;
  chain: string;
  existing_cf_info: {
    distribution_id: string;
    config_version_id: string;
  };
}

// interface ExistingCfInfo {
//   distribution_id: string;
//   config_version_id: string;
// }

// interface CNameInfo {
//   domainName: string;
//   sanList: string[];
//   originsItemsDomainName: string;
//   existing_cf_info: ExistingCfInfo;
// }

// interface CNameInfo {
//   domainName: string;
//   sanList: [];
//   originsItemsDomainName: string;
//   existing_cf_info: {
//     distribution_id: string;
//     config_version_id: string;
//   };
// }

const ACM_PLACEHOLDER_BODY =
  "-----BEGIN CERTIFICATE----- \nXXXXXX \n-----END CERTIFICATE-----";

const ACM_PLACEHOLDER_PRIVKEY =
  "-----BEGIN PRIVATE KEY----- \nXXXXXX \n-----END PRIVATE KEY-----";

const ACM_PLACEHOLDER_CHAIN =
  "-----BEGIN CERTIFICATE----- \nXXXXXX \n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE----- \nXXXXXX \n-----END CERTIFICATE-----";

const ImportStart: React.FC = () => {
  const navigate = useNavigate();
  // const domainCertList = [
  //   {
  //     domainList: "",
  //   },
  // ];
  // const [domainCertList, setDomainCertList] = useState([
  //   {
  //     domainList: "",
  //   },
  // ]);
  // const [importMethod, setImportMethod] = useState<string>(ImportMethod.IMPORT);
  const aggregation = false;
  // const [aggregation, setAggregation] = useState(false);
  const checkCName = false;
  // const [checkCName, setCheckCName] = useState(false);
  const [createAuto, setCreateAuto] = useState("true");
  const [distributionList, setDistributionList] = useState<any[]>([]);
  const [versionList, setVersionList] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [selectDistributionId, setSelectDistributionId] = useState<any>("");
  const [selectDistributionVersionId, setSelectDistributionVersionId] =
    useState<any>("1");
  const [confirm, setConfirm] = useState("");

  const [importCert, setImportCert] = useState<string>(
    ImportCertificate.IMPORT_ONE
  );

  const cnameInfo = {
    domainName: "",
    sanList: [],
    originsItemsDomainName: "",
    existing_cf_info: {
      distribution_id: "",
      config_version_id: "",
    },
  };
  // const [cnameInfo, setCnameInfo] = useState<CNameInfo>({
  //   domainName: "",
  //   sanList: [],
  //   originsItemsDomainName: "",
  //   existing_cf_info: {
  //     distribution_id: "",
  //     config_version_id: "",
  //   },
  // });
  // const [cnameInfoList, setCnameInfoList] = useState<[CNameInfo]>([
  //   {
  //     domainName: "",
  //     sanList: [""],
  //     originsItemsDomainName: "",
  //     existing_cf_info: {
  //       distribution_id: "",
  //       config_version_id: "",
  //     },
  //   },
  // ]);

  const [certInfo, setCertInfo] = useState<CertInfo>({
    body: "",
    privateKey: "",
    chain: "",
    existing_cf_info: {
      distribution_id: "",
      config_version_id: "",
    },
  });

  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("ssl:sslList"),
      link: "/config/certification/list",
    },
    {
      name: t("ssl:importExist"),
    },
  ];

  // Get Version List By Distribution
  const getVersionListByDistribution = async () => {
    try {
      while (selectDistributionId === "") {
        await new Promise((r) => setTimeout(r, 500));
      }
      setVersionList([]);
      const resData = await appSyncRequestQuery(listCloudfrontVersions, {
        distribution_id: selectDistributionId,
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
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getVersionListByDistribution();
  }, [selectDistributionId]);

  // Get Distribution List
  const getDistributionList = async () => {
    try {
      setDistributionList([]);
      const resData = await appSyncRequestQuery(listDistribution);
      const Cloudfront_info_list: any[] = resData.data.listDistribution;
      const tmpList = [];
      for (const cfdistlistKey in Cloudfront_info_list) {
        tmpList.push({
          name:
            Cloudfront_info_list[cfdistlistKey].id +
            " | " +
            (Cloudfront_info_list[cfdistlistKey].aliases.Quantity === 0
              ? ""
              : Cloudfront_info_list[cfdistlistKey].aliases.Items[0]),
          value: Cloudfront_info_list[cfdistlistKey].id,
        });
      }
      setDistributionList(tmpList);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getDistributionList();
  }, []);

  const generateCertCreateImportParam = (): any => {
    cnameInfo.existing_cf_info.distribution_id = selectDistributionId;
    cnameInfo.existing_cf_info.config_version_id = selectDistributionVersionId;
    const sslForSaasRequest = {
      // acm_op: importMethod === ImportMethod.CREATE ? "create" : "import",
      acm_op: "import",
      auto_creation: createAuto,
      dist_aggregate: aggregation ? "true" : "false",
      enable_cname_check: checkCName ? "true" : "false",
      cnameList: [],
      pemList: [
        {
          CertPem: certInfo.body,
          PrivateKeyPem: certInfo.privateKey,
          ChainPem: certInfo.chain,
          // originsItemsDomainName: cnameInfo.originsItemsDomainName,
          existing_cf_info: {
            distribution_id: certInfo.existing_cf_info.distribution_id,
            config_version_id: certInfo.existing_cf_info.config_version_id,
          },
        },
      ],
    };
    return sslForSaasRequest;
  };

  // Get Version List By Distribution
  const startCertRequest = async (certCreateOrImportInput: any) => {
    try {
      const resData = await appSyncRequestMutation(certCreateOrImport, {
        input: certCreateOrImportInput,
      });
      navigate(
        "/config/certification/job/" + resData.data.certCreateOrImport.body
      );
    } catch (error) {
      console.error(error);
    }
  };

  const updateCertInfoWithDistributionIdVersion = (
    distributionId: string,
    version: string
  ) => {
    // traverse the cnameInfoList
    // cnameInfo.existing_cf_info.distribution_id = distributionId;
    certInfo.existing_cf_info.distribution_id = distributionId;
    certInfo.existing_cf_info.config_version_id = version;
  };

  useEffect(() => {
    updateCertInfoWithDistributionIdVersion(
      selectDistributionId,
      selectDistributionVersionId
    );
  }, [selectDistributionId, selectDistributionVersionId]);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title={t("ssl:importExist")}>
          <HeaderPanel title={t("ssl:import.certDetail")}>
            <FormItem optionTitle={t("ssl:import.importCerts")} optionDesc="">
              <Tiles
                name="importCertificate"
                value={importCert}
                onChange={(event) => {
                  setImportCert(event.target.value);
                }}
                items={[
                  {
                    label: t("ssl:import.importOne"),
                    description: t("ssl:import.importOneDesc"),
                    value: ImportCertificate.IMPORT_ONE,
                  },
                  {
                    label: t("ssl:import.importMulti"),
                    description: t("ssl:import.importMultiDesc"),
                    value: ImportCertificate.IMPORT_MULTI,
                  },
                ]}
              />
            </FormItem>
            {importCert === ImportCertificate.IMPORT_ONE ? (
              <div>
                <FormItem
                  optionTitle={t("ssl:import.certBody")}
                  optionDesc={t("ssl:import.certBodyDesc")}
                >
                  <TextArea
                    rows={4}
                    placeholder={ACM_PLACEHOLDER_BODY}
                    value={certInfo.body}
                    onChange={(event) => {
                      setCertInfo((prev) => {
                        return { ...prev, body: event.target.value };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle={t("ssl:import.certPrivkey")}
                  optionDesc={t("ssl:import.certPrivKeyDesc")}
                >
                  <TextArea
                    rows={4}
                    placeholder={ACM_PLACEHOLDER_PRIVKEY}
                    value={certInfo.privateKey}
                    onChange={(event) => {
                      setCertInfo((prev) => {
                        return { ...prev, privateKey: event.target.value };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle={t("ssl:import.certChain")}
                  optionDesc={t("ssl:import.certChainDesc")}
                >
                  <TextArea
                    rows={7}
                    placeholder={ACM_PLACEHOLDER_CHAIN}
                    value={certInfo.chain}
                    onChange={(event) => {
                      setCertInfo((prev) => {
                        return { ...prev, chain: event.target.value };
                      });
                    }}
                  />
                </FormItem>
              </div>
            ) : (
              <FormItem
                optionTitle={t("ssl:import.commingLater")}
                optionDesc=""
                // optionDesc="S3 bucket path"
              >
                {/*<TextInput*/}
                {/*  placeholder="s3://auth-at-edge-origin-public-348167721134/js/"*/}
                {/*  value={s3FilePath}*/}
                {/*  onChange={(event) => {*/}
                {/*    setS3FilePath(event.target.value);*/}
                {/*  }}*/}
                {/*/>*/}
              </FormItem>
            )}
          </HeaderPanel>

          <HeaderPanel title={t("cfDistribution")}>
            <FormItem optionTitle={t("ssl:importMethod")} optionDesc="">
              <Tiles
                name="importMethod"
                value={createAuto}
                onChange={(event) => {
                  setCreateAuto(event.target.value);
                }}
                items={[
                  {
                    label: t("ssl:autoCreateDistribution"),
                    description: t("ssl:autoCreateDistributionDesc"),
                    value: "true",
                  },
                  {
                    label: t("ssl:donotCreateDistribution"),
                    description: t("ssl:donotCreateDistributionDesc"),
                    value: "false",
                  },
                ]}
              />
            </FormItem>

            {createAuto === "true" ? (
              <FormItem
                optionTitle={t("ssl:sourceDistribution")}
                optionDesc={t("ssl:sourceDistributionDesc")}
              >
                <div>
                  <Select
                    placeholder={t("ssl:chooseDistributionAsSource")}
                    optionList={distributionList}
                    value={selectDistributionId}
                    onChange={(event) => {
                      setSelectDistributionId(event.target.value);
                      setVersionList([]);
                      setSelectDistributionVersionId("1");
                      getVersionListByDistribution();
                    }}
                  />
                  <br />
                  <Select
                    optionList={versionList}
                    value={selectDistributionVersionId}
                    placeholder={t("ssl:selectVersion")}
                    onChange={(event) => {
                      setSelectDistributionVersionId(event.target.value);
                    }}
                  />
                </div>
              </FormItem>
            ) : (
              ""
            )}
          </HeaderPanel>

          <div className="button-action text-right">
            <Button
              btnType="text"
              onClick={() => navigate("/config/certification/list")}
            >
              {t("button.cancel")}
            </Button>
            <Button
              btnType="primary"
              disabled={importCert === ImportCertificate.IMPORT_MULTI}
              onClick={() => {
                updateCertInfoWithDistributionIdVersion(
                  selectDistributionId,
                  selectDistributionVersionId
                );
                generateCertCreateImportParam();
                // startCertRequest(requestParam);
                setOpenModal(true);
              }}
            >
              {t("button.startJob")}
            </Button>
          </div>
        </PagePanel>
        <Modal
          title={t("ssl:confirmSetting")}
          isOpen={openModal}
          fullWidth={true}
          closeModal={() => {
            setOpenModal(false);
          }}
          actions={
            <div>
              <FormItem optionTitle="" optionDesc={t("ssl:confirmApply")}>
                <TextInput
                  value={confirm}
                  placeholder={t("confirm")}
                  onChange={(event) => {
                    setConfirm(event.target.value);
                  }}
                />
              </FormItem>
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
                  disabled={confirm !== t("confirm")}
                  btnType="primary"
                  loading={loadingApply}
                  onClick={() => {
                    // startWorkflow();
                    setLoadingApply(true);
                    const requestParam = generateCertCreateImportParam();
                    startCertRequest(requestParam);
                    setLoadingApply(false);
                    Swal.fire(
                      t("ssl:import.certImportSent"),
                      t("ssl:import.certImportTrigger"),
                      "success"
                    );
                  }}
                >
                  {t("button.apply")}
                </Button>
              </div>
            </div>
          }
        >
          <div className="gsui-modal-content">
            <HeaderPanel title={t("ssl:confirmRequestParam")}>
              <FormItem optionTitle={t("ssl:curSSLParam")} optionDesc="">
                <div>
                  <TextArea
                    rows={20}
                    placeholder={`www.example1.com\nwww.example2.com`}
                    value={JSON.stringify(
                      generateCertCreateImportParam(),
                      null,
                      4
                    )}
                    onChange={() => {
                      //do nothing
                    }}
                  />
                </div>
              </FormItem>
            </HeaderPanel>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ImportStart;
