import React, { useEffect, useState } from "react";
import Button from "components/Button";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import TextArea from "components/TextArea";
import Tiles from "components/Tiles";
import Select from "components/Select";
import { CF_LIST, CF_SNAPSHOT_LIST } from "mock/data";
import MultiSelect from "components/MultiSelect";
import Switch from "components/Switch";
import { useNavigate } from "react-router-dom";
import TagList from "components/TagList";
import Breadcrumb from "components/Breadcrumb";
import { CNameInfo } from "../../certificate/Create";
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

// enum ImportMethodType {
//   CREATE = "CREATE",
//   NONE = "NONE",
// }
const enum ImportMethod {
  CREATE = "Create",
  IMPORT = "Import",
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

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Certification List",
    link: "/config/sslcertificate/list",
  },
  {
    name: "Create new certificates",
  },
];

const CreateStart: React.FC = () => {
  const navigate = useNavigate();
  const [domainCertList, setDomainCertList] = useState([
    {
      domain: "",
    },
  ]);
  const [cloudFront, setCloudFront] = useState("");
  const [snapshot, setSnapshot] = useState([]);
  const [importMethod, setImportMethod] = useState<string>(ImportMethod.CREATE);
  const [createAsLess, setCreateAsLess] = useState(true);
  const [tagList, setTagList] = useState([{ key: "", value: "" }]);
  const [aggregation, setAggregation] = useState(false);
  const [checkCName, setCheckCName] = useState(false);
  const [createAuto, setCreateAuto] = useState(true);
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
      cnameList: [cnameInfo],
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

  const changeDomainList = (index: number, value: string) => {
    const tmpList = JSON.parse(JSON.stringify(domainCertList));
    tmpList[index].domain = value;
    setDomainCertList(tmpList);
  };

  const addDomainList = () => {
    setDomainCertList((prev) => {
      return [
        ...prev,
        {
          domain: "",
        },
      ];
    });
  };

  const removeDomain = (index: number) => {
    const tmpList = JSON.parse(JSON.stringify(domainCertList));
    tmpList.splice(index, 1);
    setDomainCertList(tmpList);
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title="Create a new certificate">
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
                          value={element.domain}
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
                name="importMethod"
                value={importMethod}
                onChange={(event) => {
                  setImportMethod(event.target.value);
                }}
                items={[
                  {
                    label: "Do not create distributions",
                    description: "Only request certificates",
                    value: ImportMethod.NONE,
                  },
                  {
                    label: "Automatically create distributions",
                    description:
                      "Request certificates and then create distributions",
                    value: ImportMethod.CREATE,
                  },
                ]}
              />
            </FormItem>

            {importMethod === ImportMethod.CREATE ? (
              <FormItem
                optionTitle="Source distribution"
                optionDesc="Apply the origin setting from an existing CloudFront distribution. It will use the "
              >
                <div>
                  <Select
                    placeholder="Choose a CloudFront distribution as source"
                    optionList={CF_LIST}
                    value={cloudFront}
                    onChange={(event) => {
                      setCloudFront(event.target.value);
                    }}
                  />
                  <MultiSelect
                    className="mt-10"
                    optionList={CF_SNAPSHOT_LIST}
                    value={snapshot}
                    placeholder="Choose the snapshot of the CloudFront distribution"
                    onChange={(items) => {
                      setSnapshot(items);
                    }}
                  />
                </div>
              </FormItem>
            ) : (
              ""
            )}
          </HeaderPanel>

          <HeaderPanel title="Advanced Settings">
            <Switch
              label="Create as less as distibutions as possible"
              desc="Aggregate CNAMEs. For example, x1.example.com, x2.example.com, will be a aggregated to *.example.com"
              isOn={createAsLess}
              handleToggle={() => {
                setCreateAsLess(!createAsLess);
              }}
            />
          </HeaderPanel>

          <HeaderPanel
            title="Tags"
            desc="A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You can use tags to search and filter your resources or track your AWS costs."
          >
            <TagList
              tagList={tagList}
              addTag={() => {
                setTagList((prev) => {
                  const tmpList = JSON.parse(JSON.stringify(prev));
                  tmpList.push({
                    key: "",
                    value: "",
                  });
                  return tmpList;
                });
              }}
              removeTag={(index) => {
                setTagList((prev) => {
                  const tmpList = JSON.parse(JSON.stringify(prev));
                  tmpList.splice(index, 1);
                  return tmpList;
                });
              }}
              onChange={(index, key, value) => {
                setTagList((prev) => {
                  const tmpList = JSON.parse(JSON.stringify(prev));
                  tmpList[index].key = key;
                  tmpList[index].value = value;
                  // changeTags(tmpList);
                  return tmpList;
                });
              }}
            />
          </HeaderPanel>

          <div className="button-action text-right">
            <Button btnType="text">Cancel</Button>
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/jobs/detail/NAFDS-11-AA/InProgress/1");
              }}
            >
              Start Job
            </Button>
          </div>
        </PagePanel>
      </div>
    </div>
  );
};

export default CreateStart;
