import React, { useState, useEffect } from "react";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import TagList from "components/TagList";
import Tiles from "components/Tiles";
import Modal from "components/Modal";
import Switch from "components/Switch";
import FormItem from "components/FormItem";
import TextInput from "components/TextInput";
import TextArea from "components/TextArea";
import { CertificateType, CERT_IN_ACCOUNT_LIST } from "mock/data";
import { SelectType, TablePanel } from "components/TablePanel";
import AddCName from "./AddCName";
import { CNameInfo } from "../Create";
import {
  appSyncRequestMutation,
  appSyncRequestQuery,
} from "../../../../assets/js/request";
import { certCreateOrImport } from "../../../../graphql/mutations";
import Button from "../../../../components/Button";
import { Version } from "../../../../API";
import {
  listCloudfrontVersions,
  listDistribution,
} from "../../../../graphql/queries";
import LoadingText from "components/LoadingText";
import MultiSelect from "../../../../components/MultiSelect";
import Select from "../../../../components/Select";
import { json } from "stream/consumers";

const enum ImportMethod {
  CREATE = "Create",
  IMPORT = "Import",
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

const ConfigCertificate: React.FC = () => {
  const [importMethod, setImportMethod] = useState<string>(ImportMethod.CREATE);
  const [aggregation, setAggregation] = useState(false);
  const [checkCName, setCheckCName] = useState(false);
  const [createAuto, setCreateAuto] = useState(false);
  const [distributionList, setDistributionList] = useState<any[]>([]);
  const [versionList, setVersionList] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
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
  const [certInfo, setCertInfo] = useState<CertInfo>({
    name: "",
    body: "",
    privateKey: "",
    chain: "",
  });
  const [s3FilePath, setS3FilePath] = useState("");

  // Get Version List By Distribution
  const getVersionListByDistribution = async () => {
    // try {
    //   setLoadingData(true);
    //   setVersionList([]);
    //   const resData = await appSyncRequestQuery(listCloudfrontVersions, {
    //     distribution_id: selectDistributionId,
    //   });
    //   const versionList: Version[] = resData.data.listCloudfrontVersions;
    //   setLoadingData(false);
    //   setVersionList(versionList);
    // } catch (error) {
    //   setLoadingData(false);
    //   console.error(error);
    // }
    try {
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

  // useEffect(() => {
  //   getVersionListByDistribution();
  // }, [selectDistributionId]);

  // Get Version List By Distribution
  const getDistributionList = async () => {
    try {
      setDistributionList([]);
      const resData = await appSyncRequestQuery(listDistribution);
      const Cloudfront_info_list: any[] = resData.data.listDistribution;
      const tmpList = [];
      for (const cfdistlistKey in Cloudfront_info_list) {
        tmpList.push({
          name: Cloudfront_info_list[cfdistlistKey].id,
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

  // const [certInAccountList, setCertInAccountList] = useState<CertificateType[]>(
  //   []
  // );
  //
  // useEffect(() => {
  //   setCertInAccountList(CERT_IN_ACCOUNT_LIST);
  // }, []);

  const generateCertCreateImportParam = (): any => {
    cnameInfo.existing_cf_info.distribution_id = selectDistributionId;
    cnameInfo.existing_cf_info.config_version_id = selectDistributionVersionId;
    const sslForSaasRequest = {
      acm_op: importMethod === ImportMethod.CREATE ? "create" : "import",
      auto_creation: createAuto ? "true" : "false",
      dist_aggregate: aggregation ? "true" : "false",
      enable_cname_check: checkCName ? "true" : "false",
      cnameList: cnameInfo,
      pemList: [
        {
          CertPem: certInfo.body,
          PrivateKeyPem: certInfo.privateKey,
          ChainPem: certInfo.chain,
          originsItemsDomainName: cnameInfo.originsItemsDomainName,
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
      // const resData = await appSyncRequestMutation(
      //   certCreateOrImport,
      //     { input:certCreateOrImportInput }
      // );
      console.info(resData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <PagePanel title="Create certification">
        <HeaderPanel title="Certification type">
          <div>
            <div className="mt-10">
              <Switch
                label="Aggregation"
                desc="List any custom domain names that you use in addition to the CloudFront domain name for the URLs for your files."
                isOn={aggregation}
                handleToggle={() => {
                  setAggregation(!aggregation);
                }}
              />
            </div>
            <div className="mt-10">
              <Switch
                label="Enable CName check"
                desc="Whether need to check the cname"
                isOn={checkCName}
                handleToggle={() => {
                  setCheckCName(!checkCName);
                }}
              />
            </div>
            <div className="mt-10">
              <Switch
                label="Create CloudFront distribution automatically"
                desc="List any custom domain names that you use in addition to the CloudFront domain name for the URLs for your files."
                isOn={createAuto}
                handleToggle={() => setCreateAuto(!createAuto)}
              />
            </div>
            <div className="mt-10">
              {/*<FormItem*/}
              {/*  optionTitle="Origin domain"*/}
              {/*  optionDesc="Choose an AWS origin, or enter your origin's domain name."*/}
              {/*>*/}
              {/*  <TextInput*/}
              {/*    className="m-w-75p"*/}
              {/*    placeholder="www.example.com"*/}
              {/*    value={originDomain}*/}
              {/*    onChange={(event) => {*/}
              {/*      setOriginDomain(event.target.value);*/}
              {/*    }}*/}
              {/*  />*/}
              {/*</FormItem>*/}
              <FormItem optionTitle="Import method" optionDesc="">
                <Tiles
                  name="importMethod"
                  value={importMethod}
                  onChange={(event) => {
                    setImportMethod(event.target.value);
                  }}
                  items={[
                    {
                      label: "Create new certification",
                      description: "Create one ore more ACM certificate",
                      value: ImportMethod.CREATE,
                    },
                    {
                      label: "Import existed certifications",
                      description: "Import existed certifications",
                      value: ImportMethod.IMPORT,
                    },
                  ]}
                />
              </FormItem>
            </div>
          </div>
        </HeaderPanel>

        {importMethod === ImportMethod.CREATE ? (
          <HeaderPanel title="Create Certification Panel">
            <FormItem
              optionTitle="Create one or more Certification"
              optionDesc=""
            >
              <Tiles
                name="createCertificate"
                value={createCert}
                onChange={(event) => {
                  setCreateCert(event.target.value);
                }}
                items={[
                  {
                    label: "Create one certification",
                    description: "Create one",
                    value: CreateCertificate.CREATE_ONE,
                  },
                  {
                    label: "Create multiple certifications",
                    description:
                      "Create multiple certification by providing file link, etc.",
                    value: CreateCertificate.CREATE_MULTI,
                  },
                ]}
              />
            </FormItem>
            {createCert === CreateCertificate.CREATE_ONE ? (
              <div>
                <FormItem
                  optionTitle="Domain Name"
                  optionDesc="Enter the domain name for target certification"
                >
                  <TextInput
                    placeholder="xxx.mycompany.com"
                    value={cnameInfo.domainName}
                    onChange={(event) => {
                      setCnameInfo((prev) => {
                        return { ...prev, domainName: event.target.value };
                      });
                    }}
                  />
                </FormItem>

                <FormItem
                  optionTitle="Origin Items Domain Name"
                  optionDesc="Choose an AWS origin, or enter your origin's domain name."
                >
                  <TextInput
                    placeholder="Choose origin domain"
                    value={cnameInfo.originsItemsDomainName}
                    onChange={(event) => {
                      setCnameInfo((prev) => {
                        return {
                          ...prev,
                          originsItemsDomainName: event.target.value,
                        };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle="Additional Domain names"
                  optionDesc="You can add additional names to this certificate. For example, if you're requesting a certificate for 'www.example.com', you might want to add the name 'example.com' so that customers can reach your site by either name."
                >
                  <TextArea
                    rows={3}
                    placeholder={`www.example1.com\nwww.example2.com`}
                    value={cnameInfo.sanList.toString()}
                    onChange={(event) => {
                      setCnameInfo((prev) => {
                        return { ...prev, sanList: event.target.value };
                      });
                    }}
                  />
                </FormItem>

                <FormItem
                  optionTitle="Existing CloudFront Info"
                  optionDesc="Select the config version of existing CloudFront distribution"
                >
                  <div className="flex">
                    <div style={{ width: 800 }}>
                      <Select
                        optionList={distributionList}
                        value={selectDistributionId}
                        placeholder="Select distribution"
                        onChange={(event) => {
                          setSelectDistributionId(event.target.value);
                          getVersionListByDistribution();
                        }}
                      />
                    </div>
                  </div>
                  <br />
                  <div className="flex">
                    <div style={{ width: 800 }}>
                      <Select
                        optionList={versionList}
                        value={selectDistributionVersionId}
                        placeholder="Select version "
                        onChange={(event) => {
                          setSelectDistributionVersionId(event.target.value);
                        }}
                      />
                    </div>
                  </div>
                </FormItem>
              </div>
            ) : (
              <FormItem
                optionTitle="Certification file path"
                optionDesc="S3 bucket path"
              >
                <TextInput
                  placeholder="s3://auth-at-edge-origin-public-348167721134/js/"
                  value={s3FilePath}
                  onChange={(event) => {
                    setS3FilePath(event.target.value);
                  }}
                />
              </FormItem>
            )}
          </HeaderPanel>
        ) : (
          ""
        )}

        {importMethod === ImportMethod.IMPORT ? (
          <HeaderPanel title="Import Certification Panel">
            <FormItem
              optionTitle="Import one or more Certification"
              optionDesc=""
            >
              <Tiles
                name="importCertificate"
                value={importCert}
                onChange={(event) => {
                  setImportCert(event.target.value);
                }}
                items={[
                  {
                    label: "Import one certification",
                    description: "Import one",
                    value: ImportCertificate.IMPORT_ONE,
                  },
                  {
                    label: "Import multiple certifications",
                    description:
                      "Import multiple certification by providing cert link, etc.",
                    value: ImportCertificate.IMPORT_MULTI,
                  },
                ]}
              />
            </FormItem>
            {importCert === ImportCertificate.IMPORT_ONE ? (
              <div>
                <FormItem
                  optionTitle="Domain Name"
                  optionDesc="Enter the domain name for target certification"
                >
                  <TextInput
                    placeholder="xxx.mycompany.com"
                    value={cnameInfo.domainName}
                    onChange={(event) => {
                      setCnameInfo((prev) => {
                        return { ...prev, domainName: event.target.value };
                      });
                    }}
                  />
                </FormItem>

                <FormItem
                  optionTitle="Origin Items Domain Name"
                  optionDesc="Choose an AWS origin, or enter your origin's domain name."
                >
                  <TextInput
                    placeholder="Choose origin domain"
                    value={cnameInfo.originsItemsDomainName}
                    onChange={(event) => {
                      setCnameInfo((prev) => {
                        return {
                          ...prev,
                          originsItemsDomainName: event.target.value,
                        };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle="Additional Domain names"
                  optionDesc="You can add additional names to this certificate. For example, if you're requesting a certificate for 'www.example.com', you might want to add the name 'example.com' so that customers can reach your site by either name."
                >
                  <TextArea
                    rows={3}
                    placeholder={`www.example1.com\nwww.example2.com`}
                    value={cnameInfo.sanList.toString()}
                    onChange={(event) => {
                      setCnameInfo((prev) => {
                        return { ...prev, sanList: event.target.value };
                      });
                    }}
                  />
                </FormItem>

                <FormItem
                  optionTitle="Existing CloudFront Info"
                  optionDesc="Select the config version of existing CloudFront distribution"
                >
                  <div className="flex">
                    <div style={{ width: 800 }}>
                      <Select
                        optionList={distributionList}
                        value={selectDistributionId}
                        placeholder="Select distribution"
                        onChange={(item) => {
                          setSelectDistributionId(item);
                          getVersionListByDistribution();
                        }}
                      />
                    </div>
                  </div>
                  <br />
                  <div className="flex">
                    <div style={{ width: 800 }}>
                      <Select
                        optionList={versionList}
                        value={selectDistributionVersionId}
                        placeholder="Select version "
                        onChange={(event) => {
                          setSelectDistributionVersionId(event.target.value);
                        }}
                      />
                    </div>
                  </div>
                </FormItem>
                <FormItem
                  optionTitle="Certification name"
                  optionDesc="Enter the name of the object that you want CloudFront to return when a viewer request points to your root URL."
                >
                  <TextInput
                    placeholder="Demo"
                    value={certInfo.name}
                    onChange={(event) => {
                      setCertInfo((prev) => {
                        return { ...prev, name: event.target.value };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle="Certificate body"
                  optionDesc="List any custom domain names that you use in addition to the CloudFront domain name for the URLs for your files."
                >
                  <TextArea
                    rows={3}
                    placeholder="PEM-encoded certificate"
                    value={certInfo.body}
                    onChange={(event) => {
                      setCertInfo((prev) => {
                        return { ...prev, body: event.target.value };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle="Certificate private key"
                  optionDesc="List any custom domain names that you use in addition to the CloudFront domain name for the URLs for your files."
                >
                  <TextArea
                    rows={3}
                    placeholder="PEM-encoded certificate"
                    value={certInfo.privateKey}
                    onChange={(event) => {
                      setCertInfo((prev) => {
                        return { ...prev, privateKey: event.target.value };
                      });
                    }}
                  />
                </FormItem>
                <FormItem
                  optionTitle="Certificate chain"
                  optionDesc="List any custom domain names that you use in addition to the CloudFront domain name for the URLs for your files."
                >
                  <TextArea
                    rows={3}
                    placeholder="PEM-encoded certificate"
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
                optionTitle="Certification file path"
                optionDesc="S3 bucket path"
              >
                <TextInput
                  placeholder="s3://auth-at-edge-origin-public-348167721134/js/"
                  value={s3FilePath}
                  onChange={(event) => {
                    setS3FilePath(event.target.value);
                  }}
                />
              </FormItem>
            )}
          </HeaderPanel>
        ) : (
          ""
        )}
        {/*<AddCName></AddCName>*/}
        {/*<HeaderPanel contentNoPadding title="Certificates in Account">*/}
        {/*  <TablePanel*/}
        {/*    hideHeader*/}
        {/*    title=""*/}
        {/*    actions={<div></div>}*/}
        {/*    selectType={SelectType.NONE}*/}
        {/*    pagination={<div></div>}*/}
        {/*    items={certInAccountList}*/}
        {/*    columnDefinitions={[*/}
        {/*      {*/}
        {/*        // width: 250,*/}
        {/*        id: "id",*/}
        {/*        header: "id",*/}
        {/*        cell: (e: CertificateType) => e.id,*/}
        {/*        // sortingField: "alt",*/}
        {/*      },*/}
        {/*      {*/}
        {/*        id: "domainName",*/}
        {/*        header: "Domain Name",*/}
        {/*        cell: (e: CertificateType) => e.domainName,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        width: 120,*/}
        {/*        id: "type",*/}
        {/*        header: "Type",*/}
        {/*        cell: (e: CertificateType) => e.type,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        width: 160,*/}
        {/*        id: "status",*/}
        {/*        header: "Status",*/}
        {/*        cell: (e: CertificateType) => e.status,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        // width: 150,*/}
        {/*        id: "tags",*/}
        {/*        header: "Tags",*/}
        {/*        cell: (e: CertificateType) => e.tags,*/}
        {/*      },*/}
        {/*    ]}*/}
        {/*    filter={<div></div>}*/}
        {/*    changeSelected={(item) => {*/}
        {/*      console.info("select item:", item);*/}
        {/*      // setSelectedItems(item);*/}
        {/*      // setExtentionList(MOCK_REPOSITORY_LIST);*/}
        {/*    }}*/}
        {/*  />*/}
        {/*</HeaderPanel>*/}
        {/*<HeaderPanel*/}
        {/*  title="Tags"*/}
        {/*  desc="A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You can use tags to search and filter your resources or track your AWS costs."*/}
        {/*>*/}
        {/*  <TagList*/}
        {/*    tagList={[]}*/}
        {/*    addTag={() => {*/}
        {/*      console.info("add");*/}
        {/*    }}*/}
        {/*    removeTag={(e) => {*/}
        {/*      console.info(e);*/}
        {/*    }}*/}
        {/*    onChange={(e) => {*/}
        {/*      console.info(e);*/}
        {/*    }}*/}
        {/*  />*/}
        {/*</HeaderPanel>*/}

        <Button
          btnType="primary"
          onClick={() => {
            const requestParam = generateCertCreateImportParam();
            console.info(requestParam);
            // startCertRequest(requestParam);
            setOpenModal(true);
          }}
        >
          Start Workflow
        </Button>
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
              }}
            >
              Apply
            </Button>
          </div>
        }
      >
        <div className="gsui-modal-content">
          <HeaderPanel title="Certification type">
            <FormItem
              optionTitle="Distribution"
              optionDesc="Distribution to apply configurations"
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
  );
};

export default ConfigCertificate;
