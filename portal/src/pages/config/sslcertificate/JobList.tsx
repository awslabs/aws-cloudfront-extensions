import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import RefreshIcon from "@material-ui/icons/Refresh";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import TextInput from "components/TextInput";
import { Link, useNavigate } from "react-router-dom";
import PagePanel from "components/PagePanel";
import Status from "components/Status/Status";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "SSL Certificate Jobs",
    link: "",
  },
];

interface JobType {
  statusId: string;
  jobId: string;
  jobType: string;
  totalCert: string;
  totalDistribution: string;
  created: string;
  status: string;
  details: string;
}

const CERT_LIST_DATA: JobType[] = [
  {
    statusId: "1",
    jobId: "NAFDS-11-AA",
    jobType: "Create",
    totalCert: "1",
    totalDistribution: "2",
    created: "2022-07-07 18:34",
    status: "InProgress",
    details: "0 of 66 is processed",
  },
  {
    statusId: "2",
    jobId: "NAFDS-22-BB",
    jobType: "Import",
    totalCert: "3",
    totalDistribution: "4",
    created: "2022-07-07 18:34",
    status: "InProgress",
    details: "10 of 88 is processed",
  },
  {
    statusId: "3",
    jobId: "NAFDS-33-CC",
    jobType: "Create",
    totalCert: "5",
    totalDistribution: "8",
    created: "2022-07-07 18:34",
    status: "Failed",
    details: "Invalid input",
  },
  {
    statusId: "4",
    jobId: "NAFDS-44-DD",
    jobType: "Create",
    totalCert: "7",
    totalDistribution: "10",
    created: "2022-07-07 18:34",
    status: "Success",
    details: "-",
  },
];

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState("");
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />

      <PagePanel
        title="SSL Certificates Jobs"
        actions={
          <div>
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/sslcertificate/list");
              }}
            >
              Show Certificate List
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/sslcertificate/import/guide");
              }}
            >
              Import Existing Certificates
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                navigate("/config/sslcertificate/create/guide");
              }}
            >
              Request New Certificate
            </Button>
          </div>
        }
      >
        <div className="mt-10">
          <TablePanel
            title="Job List"
            selectType={SelectType.NONE}
            actions={
              <div>
                <Button
                  onClick={() => {
                    // getCloudfrontDistributionList();
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </Button>
              </div>
            }
            pagination={<Pagination />}
            items={CERT_LIST_DATA}
            columnDefinitions={[
              {
                id: "jobId",
                header: "Job ID",
                cell: (e: JobType) => {
                  return (
                    <Link
                      to={`/config/jobs/detail/${e.jobId}/${e.status}/${e.statusId}`}
                    >
                      {e.jobId}
                    </Link>
                  );
                },
                // sortingField: "alt",
              },
              {
                id: "jobType",
                header: "Job Types",
                cell: (e: JobType) => e.jobType,
              },

              {
                id: "totalCert",
                header: "Total Certificates",
                cell: (e: JobType) => e.totalCert,
              },
              {
                id: "totalDistribution",
                header: "Total Distributions",
                cell: (e: JobType) => e.totalDistribution,
              },
              {
                id: "created",
                header: "Created at",
                cell: (e: JobType) => e.created,
              },
              {
                id: "status",
                header: "Status",
                cell: (e: JobType) => {
                  return <Status status={e.status} />;
                },
              },
              {
                id: "details",
                header: "Details",
                cell: (e: JobType) => e.details,
              },
            ]}
            filter={
              <div>
                <TextInput
                  value={searchParams}
                  isSearch={true}
                  placeholder={"Search all jobs"}
                  onChange={(event) => {
                    console.info("event:", event);
                    setSearchParams(event.target.value);
                  }}
                />
              </div>
            }
            changeSelected={(item) => {
              console.info("select item:", item);
              // setSelectedItems(item);
              // setcnameList(MOCK_REPOSITORY_LIST);
            }}
          />
        </div>
      </PagePanel>
    </div>
  );
};

export default JobList;
