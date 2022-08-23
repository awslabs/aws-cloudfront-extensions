import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import TextInput from "components/TextInput";
import { certification_info, Cloudfront_info, SSLJob } from "../../../API";
import { appSyncRequestQuery } from "../../../assets/js/request";
import {
  listCertifications,
  listDistribution,
  listSSLJobs,
} from "../../../graphql/queries";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "SSL for SaaS Job List",
    link: "",
  },
];

const SSLJobList: React.FC = () => {
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [jobList, setJobList] = useState<SSLJob[]>([]);

  // Get Distribution List
  const getJobList = async () => {
    try {
      setLoadingData(true);
      setJobList([]);
      const resData = await appSyncRequestQuery(listSSLJobs, {});
      const jobList: SSLJob[] = resData.data.listSSLJobs;
      setLoadingData(false);
      setJobList(jobList);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  // convert timestamp to date format
  const convertTime = (timestamp: number) => {
    const date = new Date(timestamp);
    // console.info("===>" + date);
    return date;
  };

  useEffect(() => {
    getJobList();
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          loading={loadingData}
          title={"SSL for SaaS Job List (" + jobList.length + ")"}
          selectType={SelectType.NONE}
          actions={
            <div>
              <Button
                disabled={loadingData}
                onClick={() => {
                  getJobList();
                }}
              >
                <RefreshIcon fontSize="small" />
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/list");
                }}
              >
                Show Certificate List
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/createGuide");
                }}
              >
                Request New Certificates
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/importGuide");
                }}
              >
                Import Existing Certificates
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={jobList}
          columnDefinitions={[
            {
              width: 300,
              id: "JobId",
              header: "jobId",
              cell: (e: SSLJob) => {
                return (
                  <Link to={`/config/certification/job/${e.jobId}`}>
                    {e.jobId}
                  </Link>
                );
              },
              // sortingField: "alt",
            },
            {
              width: 80,
              id: "jobType",
              header: "jobType",
              cell: (e: SSLJob) => e.jobType,
            },
            {
              width: 80,
              id: "cert_number",
              header: "Total Certificates",
              cell: (e: SSLJob) => e.cert_total_number,
            },
            {
              width: 80,
              id: "cloudfront_distribution_number",
              header: "Total Distributions",
              cell: (e: SSLJob) => e.cloudfront_distribution_total_number,
            },
            {
              width: 250,
              id: "creationDate",
              header: "Created at",
              cell: (e: SSLJob) => e.creationDate,
            },
          ]}
          // filter={
          //   // <div>
          //   //   <TextInput
          //   //     value={searchParams}
          //   //     isSearch={true}
          //   //     placeholder={"Search all certifications"}
          //   //     onChange={(event) => {
          //   //       console.info("event:", event);
          //   //       setSearchParams(event.target.value);
          //   //     }}
          //   //   />
          //   // </div>
          // }
          changeSelected={(item) => {
            // console.info("select item:", item);
            // setSelectedItems(item);
            // setcnameList(MOCK_REPOSITORY_LIST);
          }}
        />
      </div>
    </div>
  );
};

export default SSLJobList;
