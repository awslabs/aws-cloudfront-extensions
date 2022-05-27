import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import TextInput from "components/TextInput";
import { certification_info, Cloudfront_info } from "../../API";
import { appSyncRequestQuery } from "../../assets/js/request";
import { listCertifications, listDistribution } from "../../graphql/queries";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Certification List",
    link: "",
  },
];

const CertificationList: React.FC = () => {
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [certificationList, setCertificationList] = useState<
    certification_info[]
  >([]);

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    try {
      setLoadingData(true);
      setCertificationList([]);
      const resData = await appSyncRequestQuery(listCertifications, {});
      const certificationInfos: certification_info[] =
        resData.data.listCertifications;
      setLoadingData(false);
      setCertificationList(certificationInfos);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getCloudfrontDistributionList();
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          title="Certification List"
          selectType={SelectType.RADIO}
          actions={
            <div>
              <Button
                disabled={loadingData}
                onClick={() => {
                  getCloudfrontDistributionList();
                }}
              >
                <RefreshIcon fontSize="small" />
              </Button>
              {/*<Button*/}
              {/*  onClick={() => {*/}
              {/*    navigate("/404");*/}
              {/*  }}*/}
              {/*>*/}
              {/*  View Details*/}
              {/*</Button>*/}
            </div>
          }
          pagination={<Pagination />}
          items={certificationList}
          columnDefinitions={[
            {
              width: 200,
              id: "DomainName",
              header: "DomainName",
              cell: (e: certification_info) => e.DomainName,
              // sortingField: "alt",
            },
            {
              id: "CertificateArn",
              header: "CertificateArn",
              cell: (e: certification_info) => e.CertificateArn,
            },
            {
              width: 160,
              id: "certExpireOn",
              header: "Certificate expires on",
              cell: (e: certification_info) => e.NotAfter,
            },
            {
              width: 160,
              id: "Issuer",
              header: "Issuer",
              cell: (e: certification_info) => e.Issuer,
            },
            {
              width: 160,
              id: "Status",
              header: "Status",
              cell: (e: certification_info) => e.Status,
            },
            {
              width: 150,
              id: "KeyAlgorithm",
              header: "KeyAlgorithm",
              cell: (e: certification_info) => e.KeyAlgorithm,
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
      </div>
    </div>
  );
};

export default CertificationList;
