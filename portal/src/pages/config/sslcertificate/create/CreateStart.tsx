import React, { useState } from "react";
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
