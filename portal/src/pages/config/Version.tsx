import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { MOCK_CLOUDFRONT_LIST, CloudFrontType } from "mock/data";
import { Pagination } from "@material-ui/lab";
import RefreshIcon from "@material-ui/icons/Refresh";
import Status from "components/Status/Status";
import TextInput from "components/TextInput";
import { Link } from "react-router-dom";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Deployment Status",
    link: "",
  },
];

const Version = () => {
  const [cloudFrontList, setCloudFrontList] = useState(MOCK_CLOUDFRONT_LIST);
  const [searchParams, setSearchParams] = useState("");
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          title="Distributions"
          selectType={SelectType.RADIO}
          actions={
            <div>
              <Button>
                <RefreshIcon fontSize="small" />
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={cloudFrontList}
          columnDefinitions={[
            {
              width: 250,
              id: "id",
              header: "ID",
              cell: (e: CloudFrontType) => {
                return (
                  <Link to={`/config/vesrsion/detail/${e.id}`}>{e.id}</Link>
                );
              },
            },
            {
              id: "domain",
              header: "Domain",
              cell: (e: CloudFrontType) => e.domain,
            },
            {
              id: "versionCount",
              header: "Version count",
              cell: (e: CloudFrontType) => e.versionCount,
            },
            {
              width: 150,
              id: "status",
              header: "Status",
              cell: (e: CloudFrontType) => {
                return <Status status={e.status} />;
              },
            },
          ]}
          changeSelected={() => {
            setCloudFrontList(MOCK_CLOUDFRONT_LIST);
          }}
          filter={
            <div>
              <TextInput
                value={searchParams}
                isSearch={true}
                placeholder={"Search all contributions"}
                onChange={(event) => {
                  console.info("event:", event);
                  setSearchParams(event.target.value);
                }}
              />
            </div>
          }
        />
      </div>
    </div>
  );
};

export default Version;
