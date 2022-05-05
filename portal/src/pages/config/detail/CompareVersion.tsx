import React, { useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Button from "components/Button";
import Select from "components/Select";
import { CF_VERSION_LIST } from "mock/data";

const oldCode = `
const a = 10
const b = 10
const c = () => console.log('foo')

if(a > 10) {
  console.log('bar')
}

console.log('done')
`;
const newCode = `
const a = 10
const boo = 10

if(a === 10) {
  console.log('bar')
}
`;

const CompareVersion: React.FC = () => {
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
      name: "XLOWCQQFJJHM80",
      link: "/config/version/detail/XLOWCQQFJJHM80",
    },
    {
      name: "Compare",
    },
  ];

  const [leftVersion, setLeftVersion] = useState("v1");
  const [rightVersion, setRightVersion] = useState("v3");
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div>
        <HeaderPanel title="XLOWCQQFJJHM80">
          <div>
            <div className="flex">
              <div className="flex-1">
                <Select
                  className="m-w-320"
                  value={leftVersion}
                  optionList={CF_VERSION_LIST}
                  placeholder="Select version"
                  onChange={(event) => {
                    setLeftVersion(event.target.value);
                  }}
                />
              </div>
              <div className="flex-1 flex justify-between">
                <div className="flex-1">
                  <Select
                    className="m-w-320"
                    value={rightVersion}
                    optionList={CF_VERSION_LIST}
                    placeholder="Select version"
                    onChange={(event) => {
                      setRightVersion(event.target.value);
                    }}
                  />
                </div>
                <Button btnType="primary">Compare</Button>
              </div>
            </div>
            <div className="mt-10">
              <ReactDiffViewer
                oldValue={oldCode}
                newValue={newCode}
                splitView={true}
              />
            </div>
          </div>
        </HeaderPanel>
      </div>
    </div>
  );
};

export default CompareVersion;
