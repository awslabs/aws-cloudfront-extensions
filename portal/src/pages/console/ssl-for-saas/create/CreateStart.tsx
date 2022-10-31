import React, { useEffect, useState } from "react";
import Button from "components/Button";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import TextArea from "components/TextArea";
import Tiles from "components/Tiles";
import Select from "components/Select";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
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

const enum ImportMethod {
  CREATE = "create",
  IMPORT = "import",
  NONE = "NONE",
}

// interface CertInfo {
//   name: string;
//   body: string;
//   privateKey: string;
//   chain: string;
// }

interface ExistingCfInfo {
  distribution_id: string;
  config_version_id: string;
}

interface CNameInfo {
  domainName: string;
  sanList: string[];
  originsItemsDomainName: string;
  existing_cf_info: ExistingCfInfo;
}

const CreateStart: React.FC = () => {
  const navigate = useNavigate();
  const [domainCertList, setDomainCertList] = useState([
    {
      domainList: "",
    },
  ]);
  const importMethod = ImportMethod.CREATE;
  // const [importMethod, setImportMethod] = useState<string>(ImportMethod.CREATE);
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
  const [cnameInfoList, setCnameInfoList] = useState<[CNameInfo]>([
    {
      domainName: "",
      sanList: [],
      originsItemsDomainName: "",
      existing_cf_info: {
        distribution_id: "",
        config_version_id: "",
      },
    },
  ]);

  const certInfo = {
    name: "",
    body: "",
    privateKey: "",
    chain: "",
  };
  // const [certInfo, setCertInfo] = useState<CertInfo>({
  //   name: "",
  //   body: "",
  //   privateKey: "",
  //   chain: "",
  // });

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
      name: t("ssl:createNew"),
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
      acm_op: importMethod === ImportMethod.CREATE ? "create" : "import",
      auto_creation: createAuto,
      dist_aggregate: aggregation ? "true" : "false",
      enable_cname_check: checkCName ? "true" : "false",
      cnameList: cnameInfoList,
      pemList: [
        {
          CertPem: certInfo.body,
          PrivateKeyPem: certInfo.privateKey,
          ChainPem: certInfo.chain,
          originsItemsDomainName: cnameInfo.originsItemsDomainName,
          existing_cf_info: {
            distribution_id: cnameInfo.existing_cf_info.distribution_id,
            config_version_id: cnameInfo.existing_cf_info.config_version_id,
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

  const changeDomainList = (index: number, value: string) => {
    const tmpList = JSON.parse(JSON.stringify(domainCertList));
    tmpList[index].domainList = value;
    setDomainCertList(tmpList);
  };

  const addDomainList = () => {
    setDomainCertList((prev) => {
      return [
        ...prev,
        {
          domainList: "",
        },
      ];
    });
  };

  const removeDomain = (index: number) => {
    const tmpList = JSON.parse(JSON.stringify(domainCertList));
    tmpList.splice(index, 1);
    setDomainCertList(tmpList);
  };

  const updateCnameInfoList = () => {
    // traverse the domainCertList and assign the value to cnameInfoList
    setCnameInfoList([
      {
        domainName: "",
        sanList: [],
        originsItemsDomainName: "",
        existing_cf_info: {
          distribution_id: "",
          config_version_id: "",
        },
      },
    ]);
    const tmpCnameInfoList: [CNameInfo] = [
      {
        domainName: "",
        sanList: [],
        originsItemsDomainName: "",
        existing_cf_info: {
          distribution_id: "",
          config_version_id: "",
        },
      },
    ];
    cnameInfoList.splice(0, 1);
    tmpCnameInfoList.splice(0, 1);
    for (let i = 0; i < domainCertList.length; i++) {
      // first split the domainName with ","
      const tmpCnameInfo = {
        domainName: "",
        sanList: [""],
        originsItemsDomainName: "",
        existing_cf_info: {
          distribution_id: "",
          config_version_id: "",
        },
      };

      const splitDomainList = domainCertList[i].domainList.split(",");
      // console.info("domainList is " + splitDomainList);
      //assign the domain to CnameInfoList
      tmpCnameInfo.domainName = splitDomainList[0].trim();
      tmpCnameInfo.sanList = [];
      for (let j = 0; j < splitDomainList.length; j++) {
        tmpCnameInfo.sanList.push(splitDomainList[j].trim());
      }
      tmpCnameInfoList.push(tmpCnameInfo);
    }
    setCnameInfoList(tmpCnameInfoList);
    // console.info("CnameInfoList is " + JSON.stringify(tmpCnameInfoList));
  };

  const updateCnameInfoWithDistributionIdVersion = (
    distributionId: string,
    version: string
  ) => {
    // traverse the cnameInfoList
    for (const cnameInfo of cnameInfoList) {
      // cnameInfo.existing_cf_info.distribution_id = distributionId;
      cnameInfo.existing_cf_info.distribution_id = distributionId;
      cnameInfo.existing_cf_info.config_version_id = version;
    }
    // console.info(JSON.stringify(cnameInfoList));
  };

  useEffect(() => {
    updateCnameInfoList();
  }, [domainCertList]);

  useEffect(() => {
    updateCnameInfoWithDistributionIdVersion(
      selectDistributionId,
      selectDistributionVersionId
    );
  }, [selectDistributionId, selectDistributionVersionId]);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title={t("ssl:createNew")}>
          <HeaderPanel title={t("ssl:create.domainNames")}>
            <div>
              {domainCertList.map((element, index) => {
                return (
                  <FormItem
                    key={index}
                    optionTitle={t("ssl:create.domainNameForCert")}
                    optionDesc={
                      index === 0 ? t("ssl:create.pasteDomainNames") : ""
                    }
                  >
                    <div className="flex">
                      <div className="flex-1">
                        <TextArea
                          placeholder={t("ssl:create.domainNamePlaceHolder")}
                          rows={2}
                          value={element.domainList}
                          onChange={(event) => {
                            changeDomainList(index, event.target.value);
                          }}
                        ></TextArea>
                      </div>
                      <div className="ml-10">
                        <Button
                          onClick={() => {
                            removeDomain(index);
                          }}
                        >
                          {t("button.remove")}
                        </Button>
                      </div>
                    </div>
                  </FormItem>
                );
              })}
            </div>

            {domainCertList.length < 5 ? (
              <div>
                <Button
                  onClick={() => {
                    addDomainList();
                  }}
                >
                  {t("button.addDomainNameForAnotherCert")}
                </Button>
              </div>
            ) : (
              ""
            )}
          </HeaderPanel>

          <HeaderPanel title={t("cfDistribution")}>
            <FormItem optionTitle={t("ssl:importMethod")} optionDesc="">
              <Tiles
                name="autoCreate"
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
              onClick={() => {
                updateCnameInfoWithDistributionIdVersion(
                  selectDistributionId,
                  selectDistributionVersionId
                );
                generateCertCreateImportParam();
                // console.info(requestParam);
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
                  placeholder={t("ssl:confirm")}
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
                  disabled={confirm !== t("ssl:confirm")}
                  btnType="primary"
                  loading={loadingApply}
                  onClick={() => {
                    // startWorkflow();
                    setLoadingApply(true);
                    const requestParam = generateCertCreateImportParam();
                    startCertRequest(requestParam);
                    setLoadingApply(false);
                    Swal.fire(
                      t("ssl:create.certCreateSent"),
                      t("ssl:create.certCreationTrigger"),
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

export default CreateStart;
