import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import { SSLJob } from "../../../API";
import { appSyncRequestQuery } from "../../../assets/js/request";
import { listSSLJobs } from "../../../graphql/queries";
import { useTranslation } from "react-i18next";

const SSLJobList: React.FC = () => {
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(false);
  const [jobList, setJobList] = useState<SSLJob[]>([]);
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("ssl:sslJobList"),
      link: "",
    },
  ];
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
          title={t("ssl:sslJobList")}
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
                {t("button.showCertList")}
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/createGuide");
                }}
              >
                {t("button.createNewCert")}
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/importGuide");
                }}
              >
                {t("button.importCert")}
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={jobList}
          columnDefinitions={[
            {
              width: 300,
              id: "JobId",
              header: t("ssl:jobList.jobId"),
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
              header: t("ssl:jobList.jobType"),
              cell: (e: SSLJob) => e.jobType,
            },
            {
              width: 40,
              id: "cert_number",
              header: t("ssl:jobList.totalCerts"),
              cell: (e: SSLJob) => e.cert_total_number,
            },
            {
              width: 40,
              id: "cloudfront_distribution_number",
              header: t("ssl:jobList.totalCF"),
              cell: (e: SSLJob) => e.cloudfront_distribution_total_number,
            },
            {
              width: 250,
              id: "creationDate",
              header: t("ssl:jobList.createdAt"),
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
          changeSelected={() => {
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
