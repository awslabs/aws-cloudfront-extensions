import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { MOCK_CF_TASK_LIST, CFTaskType } from "mock/data";
import { Pagination } from "@material-ui/lab";
import { Link } from "react-router-dom";
import TextInput from "components/TextInput";

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

const DeploymentStatus = () => {
  const [searchParams, setSearchParams] = useState("");
  const [cloudFrontList, setCloudFrontList] = useState(MOCK_CF_TASK_LIST);
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          title="Deployment Status"
          selectType={SelectType.RADIO}
          actions={
            <div>
              <Button>Delete</Button>
              <Button btnType="primary">View Details</Button>
            </div>
          }
          pagination={<Pagination />}
          items={cloudFrontList}
          columnDefinitions={[
            {
              width: 250,
              id: "id",
              header: "ID",
              cell: (e: CFTaskType) => {
                return (
                  <Link to={`/deployment-status/detail/${e.id}`}>{e.id}</Link>
                );
              },
            },
            {
              id: "domainId",
              header: "CloudFront Distribution ID",
              cell: (e: CFTaskType) => e.domain,
            },
            {
              width: 200,
              id: "time",
              header: "Creation Time",
              cell: (e: CFTaskType) => e.time,
            },
          ]}
          changeSelected={() => {
            setCloudFrontList(MOCK_CF_TASK_LIST);
          }}
          filter={
            <div>
              <TextInput
                value={searchParams}
                isSearch={true}
                placeholder={"Search all deployment status"}
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

export default DeploymentStatus;
