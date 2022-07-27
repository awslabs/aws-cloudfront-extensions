import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import PagePanel from "components/PagePanel";
import HeaderPanel from "components/HeaderPanel";
import FormItem from "components/FormItem";
import Tiles from "components/Tiles";
import TextInput from "components/TextInput";
import TextArea from "components/TextArea";
import Select from "components/Select";
import MultiSelect from "components/MultiSelect";
import { CF_LIST, CF_SNAPSHOT_LIST } from "mock/data";
import Switch from "components/Switch";
import TagList from "components/TagList";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";

enum ImportCertificate {
  IMPORT_MULTI = "IMPORT_MULTI",
  IMPORT_ONE = "IMPORT_ONE",
}

enum ImportMethod {
  CREATE = "CREATE",
  NONE = "NONE",
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
    name: "Import existing ertificates",
  },
];

const ImportStartMock: React.FC = () => {
  const navigate = useNavigate();
  const [importCert, setImportCert] = useState<string>(
    ImportCertificate.IMPORT_ONE
  );
  const [certInfo, setCertInfo] = useState({
    name: "",
    body: "",
    privateKey: "",
    chain: "",
  });
  const [s3FilePath, setS3FilePath] = useState("");
  const [cloudFront, setCloudFront] = useState("");
  const [snapshot, setSnapshot] = useState([]);
  const [importMethod, setImportMethod] = useState<string>(ImportMethod.NONE);
  const [createAsLess, setCreateAsLess] = useState(true);
  const [tagList, setTagList] = useState([{ key: "", value: "" }]);
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title="Job ID: NSKDF-3SRS-BND">
          <HeaderPanel title="Certification details">
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
                  optionTitle="Certification name"
                  optionDesc="Enter the name of the object that you want CloudFront to return when a viewer request points to your root URL."
                >
                  <TextInput
                    placeholder="Certification name"
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
                navigate("/config/jobs/detail/NAFDS-11-AA/InProgress/2");
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

export default ImportStartMock;
