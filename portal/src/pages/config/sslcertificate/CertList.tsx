import React, { useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import RefreshIcon from "@material-ui/icons/Refresh";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import TextInput from "components/TextInput";
import { Link, useNavigate } from "react-router-dom";
import PagePanel from "components/PagePanel";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "SSL Certificates",
    link: "",
  },
];

interface CertType {
  cname: string;
  status: string;
  expireOn: string;
  distributionId: string;
  certExpireOn: string;
  jobId: string;
}

const CERT_LIST_DATA: CertType[] = [
  {
    cname: "www.example.com",
    status: "Issued",
    expireOn: "February 10, 2022",
    distributionId: "XLOWCQQFJJHM80",
    certExpireOn: "February 10, 2022",
    jobId: "NAFDS-33-M",
  },
];

const CertList: React.FC = () => {
  const [searchParams, setSearchParams] = useState("");
  const navigate = useNavigate();
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div>
        <PagePanel
          title="SSL Certificate List"
          actions={
            <div>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/jobs/list");
                }}
              >
                Show Job List
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
          <TablePanel
            className="mt-10"
            title="Certificate List"
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
                id: "cname",
                header: "CNAMEs",
                cell: (e: CertType) => {
                  return <Link to="/config/jobs/list">{e.cname}</Link>;
                },
                // sortingField: "alt",
              },
              {
                id: "cert",
                header: "SSL/TLS certificate status",
                cell: (e: CertType) => e.status,
              },

              {
                id: "certExpireOn",
                header: "Certificate expires on",
                cell: (e: CertType) => e.expireOn,
              },
              {
                id: "distribution",
                header: "CloudFront distribution",
                cell: (e: CertType) => e.distributionId,
              },
              {
                id: "Expires on",
                header: "expireOn",
                cell: (e: CertType) => e.expireOn,
              },
              {
                id: "jobId",
                header: "Job ID (Tag)",
                cell: (e: CertType) => e.jobId,
              },
            ]}
            filter={
              <div>
                <TextInput
                  value={searchParams}
                  isSearch={true}
                  placeholder={"Search all certifications"}
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
        </PagePanel>
      </div>
    </div>
  );
};

export default CertList;
