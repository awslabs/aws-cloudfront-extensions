import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import TextInput from "components/TextInput";
import { certification_info, Cloudfront_info, SSLJob } from "../../API";
import { appSyncRequestQuery } from "../../assets/js/request";
import {
  listCertifications,
  listDistribution,
  listSSLJobs,
} from "../../graphql/queries";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "SSL for SAAS Job List",
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

  useEffect(() => {
    getJobList();
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          loading={loadingData}
          title="SSL for SAAS Job List"
          selectType={SelectType.RADIO}
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
                  navigate("/config/certification/create");
                }}
              >
                Create or Import Certificates
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={jobList}
          columnDefinitions={[
            {
              width: 80,
              id: "JobId",
              header: "DomainName",
              cell: (e: SSLJob) => e.id,
              // sortingField: "alt",
            },
            {
              width: 200,
              id: "cert_completed_number",
              header: "cert_completed_number",
              cell: (e: SSLJob) => e.cert_completed_number,
            },

            {
              width: 80,
              id: "cert_total_number",
              header: "cert_total_number",
              cell: (e: SSLJob) => e.cert_total_number,
            },
            {
              width: 160,
              id: "cloudfront_distribution_created_number",
              header: "cloudfront_distribution_created_number",
              cell: (e: SSLJob) => e.cloudfront_distribution_created_number,
            },
            {
              width: 160,
              id: "cloudfront_distribution_total_number",
              header: "cloudfront_distribution_total_number",
              cell: (e: SSLJob) => e.cloudfront_distribution_total_number,
            },
            {
              width: 160,
              id: "job_input",
              header: "job_input",
              cell: (e: SSLJob) => e.job_input,
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
            console.info("select item:", item);
            // setSelectedItems(item);
            // setcnameList(MOCK_REPOSITORY_LIST);
          }}
        />
      </div>
    </div>
  );
};

export default SSLJobList;
