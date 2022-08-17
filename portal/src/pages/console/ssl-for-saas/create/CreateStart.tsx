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

const enum ImportMethod {
  CREATE = "create",
  IMPORT = "import",
  NONE = "NONE",
}

const enum ImportCertificate {
  IMPORT_ONE = "ImportOne",
  IMPORT_MULTI = "ImportMulti",
}

const enum CreateCertificate {
  CREATE_ONE = "CreateOne",
  CREATE_MULTI = "CreateMulti",
}

interface CertInfo {
  name: string;
  body: string;
  privateKey: string;
  chain: string;
}

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

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Certification List",
    link: "/config/certification/list",
  },
  {
    name: "Create new certificates",
  },
];

const CreateStart: React.FC = () => {
  const navigate = useNavigate();
  const [domainCertList, setDomainCertList] = useState([
    {
      domainList: "",
    },
  ]);
  const [snapshot, setSnapshot] = useState([]);
  const [importMethod, setImportMethod] = useState<string>(ImportMethod.CREATE);
  const [aggregation, setAggregation] = useState(false);
  const [checkCName, setCheckCName] = useState(false);
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
  const [createCert, setCreateCert] = useState<string>(
    CreateCertificate.CREATE_ONE
  );
  const [cnameInfo, setCnameInfo] = useState<CNameInfo>({
    domainName: "",
    sanList: [],
    originsItemsDomainName: "",
    existing_cf_info: {
      distribution_id: "",
      config_version_id: "",
    },
  });
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

  const [certInfo, setCertInfo] = useState<CertInfo>({
    name: "",
    body: "",
    privateKey: "",
    chain: "",
  });
  const [s3FilePath, setS3FilePath] = useState("");

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
        <PagePanel title="Create new certificates">
          <HeaderPanel title="Domain names (CNAMEs) for Certificates">
            <div>
              {domainCertList.map((element, index) => {
                return (
                  <FormItem
                    key={index}
                    optionTitle="Domain names for a certificate"
                    optionDesc={
                      index === 0 ? "Paste in custom domain names" : ""
                    }
                  >
                    <div className="flex">
                      <div className="flex-1">
                        <TextArea
                          placeholder="domain name, sanlist[0] ,sanlist[1], sanlist[2], ….sanlist[120]"
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
                          Remove
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
                  Add domain names for another certificate
                </Button>
              </div>
            ) : (
              ""
            )}
          </HeaderPanel>

          <HeaderPanel title="CloudFront Distributions">
            <FormItem optionTitle="Import method" optionDesc="">
              <Tiles
                name="autoCreate"
                value={createAuto}
                onChange={(event) => {
                  setCreateAuto(event.target.value);
                }}
                items={[
                  {
                    label: "Automatically create distributions",
                    description:
                      "Request certificates and then create distributions",
                    value: "true",
                  },
                  {
                    label: "Do not create distributions",
                    description: "Only request certificates",
                    value: "false",
                  },
                ]}
              />
            </FormItem>

            {createAuto === "true" ? (
              <FormItem
                optionTitle="Source distribution"
                optionDesc="Apply the origin setting from an existing CloudFront distribution. It will use the "
              >
                <div>
                  <Select
                    placeholder="Choose a CloudFront distribution as source"
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
                    placeholder="Select version "
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

          {/*{createAuto === "true" ? (*/}
          {/*  <HeaderPanel title="Advanced Settings">*/}
          {/*    <Switch*/}
          {/*      label="Create as less as distibutions as possible"*/}
          {/*      desc="Aggregate CNAMEs. For example, x1.example.com, x2.example.com, will be a aggregated to *.example.com"*/}
          {/*      isOn={aggregation}*/}
          {/*      handleToggle={() => {*/}
          {/*        setAggregation(!aggregation);*/}
          {/*      }}*/}
          {/*    />*/}
          {/*  </HeaderPanel>*/}
          {/*) : (*/}
          {/*  ""*/}
          {/*)}*/}

          {/*<HeaderPanel*/}
          {/*  title="Tags"*/}
          {/*  desc="A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You can use tags to search and filter your resources or track your AWS costs."*/}
          {/*>*/}
          {/*  <TagList*/}
          {/*    tagList={tagList}*/}
          {/*    addTag={() => {*/}
          {/*      setTagList((prev) => {*/}
          {/*        const tmpList = JSON.parse(JSON.stringify(prev));*/}
          {/*        tmpList.push({*/}
          {/*          key: "",*/}
          {/*          value: "",*/}
          {/*        });*/}
          {/*        return tmpList;*/}
          {/*      });*/}
          {/*    }}*/}
          {/*    removeTag={(index) => {*/}
          {/*      setTagList((prev) => {*/}
          {/*        const tmpList = JSON.parse(JSON.stringify(prev));*/}
          {/*        tmpList.splice(index, 1);*/}
          {/*        return tmpList;*/}
          {/*      });*/}
          {/*    }}*/}
          {/*    onChange={(index, key, value) => {*/}
          {/*      setTagList((prev) => {*/}
          {/*        const tmpList = JSON.parse(JSON.stringify(prev));*/}
          {/*        tmpList[index].key = key;*/}
          {/*        tmpList[index].value = value;*/}
          {/*        // changeTags(tmpList);*/}
          {/*        return tmpList;*/}
          {/*      });*/}
          {/*    }}*/}
          {/*  />*/}
          {/*</HeaderPanel>*/}

          <div className="button-action text-right">
            <Button
              btnType="text"
              onClick={() => navigate("/config/certification/list")}
            >
              Cancel
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                updateCnameInfoWithDistributionIdVersion(
                  selectDistributionId,
                  selectDistributionVersionId
                );
                const requestParam = generateCertCreateImportParam();
                // console.info(requestParam);
                // startCertRequest(requestParam);
                setOpenModal(true);
              }}
            >
              Start Job
            </Button>
          </div>
        </PagePanel>
        <Modal
          title="Confirm Certification Settings?"
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
                  // startWorkflow();
                  setLoadingApply(true);
                  const requestParam = generateCertCreateImportParam();
                  startCertRequest(requestParam);
                  setLoadingApply(false);
                  Swal.fire(
                    "Cert create Sent",
                    "Cert creation triggered",
                    "success"
                  );
                }}
              >
                Apply
              </Button>
            </div>
          }
        >
          <div className="gsui-modal-content">
            <HeaderPanel title="Please confirm the SSL request parameters">
              <FormItem
                optionTitle="Current SSL for SaaS request parameters"
                optionDesc=""
              >
                <div>
                  <TextArea
                    rows={20}
                    placeholder={`www.example1.com\nwww.example2.com`}
                    value={JSON.stringify(
                      generateCertCreateImportParam(),
                      null,
                      4
                    )}
                    onChange={(event) => {
                      //do nothing
                    }}
                  />
                </div>
              </FormItem>
            </HeaderPanel>
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
    </div>
  );
};

export default CreateStart;
