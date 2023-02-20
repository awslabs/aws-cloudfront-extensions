import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import { certification_info } from "../../../API";
import { appSyncRequestQuery } from "../../../assets/js/request";
import { listCertifications } from "../../../graphql/queries";
import { useTranslation } from "react-i18next";

const CertificationList: React.FC = () => {
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(false);
  const [certificationList, setCertificationList] = useState<
    certification_info[]
  >([]);
  const { t } = useTranslation();

  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("ssl:sslList"),
      link: "",
    },
  ];

  // Get Distribution List
  const getCertificationList = async () => {
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
    getCertificationList();
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          loading={loadingData}
          title={t("ssl:sslList")}
          selectType={SelectType.NONE}
          actions={
            <div>
              <Button
                disabled={loadingData}
                onClick={() => {
                  getCertificationList();
                }}
              >
                <RefreshIcon fontSize="small" />
              </Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/config/certification/jobs");
                }}
              >
                {t("button.showJobList")}
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
          items={certificationList}
          columnDefinitions={[
            {
              // width: 350,
              id: "DomainName",
              header: t("ssl:list.cnames"),
              cell: (e: certification_info) => e.DomainName,
              // sortingField: "alt",
            },
            {
              // width: 300,
              id: "CertificateArn",
              header: t("ssl:list.certArn"),
              cell: (e: certification_info) => e.CertificateArn,
            },

            {
              // width: 80,
              id: "Issuer",
              header: t("ssl:list.issuer"),
              cell: (e: certification_info) => e.Issuer,
            },
            {
              // width: 160,
              id: "Status",
              header: t("ssl:list.status"),
              cell: (e: certification_info) => e.Status,
            },
            {
              // width: 160,
              id: "KeyAlgorithm",
              header: t("ssl:list.keyAlgorithm"),
              cell: (e: certification_info) => e.KeyAlgorithm,
            },
            {
              // width: 160,
              id: "certExpireOn",
              header: t("ssl:list.expiresOn"),
              cell: (e: certification_info) => e.NotAfter,
            },
          ]}
          // filter={
          //   <div>
          //     <TextInput
          //       value={searchParams}
          //       isSearch={true}
          //       placeholder={"Search all certifications"}
          //       onChange={(event) => {
          //         console.info("event:", event);
          //         setSearchParams(event.target.value);
          //       }}
          //     />
          //   </div>
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

export default CertificationList;
