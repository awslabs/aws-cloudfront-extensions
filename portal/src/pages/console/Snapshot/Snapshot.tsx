import React, { useEffect, useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { Pagination } from "@material-ui/lab";
import RefreshIcon from "@material-ui/icons/Refresh";
import Status from "components/Status/Status";
import { Link } from "react-router-dom";
import { appSyncRequestQuery } from "assets/js/request";
import { listDistribution } from "graphql/queries";
import { Cloudfront_info } from "../../../API";
import { useTranslation } from "react-i18next";

const Snapshot = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [cloudFrontList, setCloudFrontList] = useState<Cloudfront_info[]>([]);
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("snapshot:list.title"),
      link: "",
    },
  ];

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    try {
      setLoadingData(true);
      setCloudFrontList([]);
      const resData = await appSyncRequestQuery(listDistribution, {
        page: 1,
        count: 10,
      });
      const cfList: Cloudfront_info[] = resData.data.listDistribution;
      setLoadingData(false);
      setCloudFrontList(cfList);
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
          loading={loadingData}
          title={t("distributions")}
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
            </div>
          }
          pagination={<Pagination />}
          items={cloudFrontList}
          columnDefinitions={[
            {
              id: "Id",
              header: t("snapshot:list.id"),
              cell: (e: Cloudfront_info) => {
                return (
                  <Link to={`/config/snapshot/detail/${e.id}`}>{e.id}</Link>
                );
              },
            },
            {
              id: "cname",
              header: t("snapshot:list.cname"),
              cell: (e: Cloudfront_info) => {
                if (e.aliases.Quantity === 0) {
                  return "";
                } else {
                  let cnameList = "";
                  for (let i = 0; i < e.aliases.Quantity; i++) {
                    cnameList = cnameList + e.aliases.Items[i] + "\n";
                  }
                  return cnameList;
                }
              },
            },
            {
              id: "domain",
              header: t("snapshot:list.domainName"),
              cell: (e: Cloudfront_info) => e.domainName,
            },
            {
              id: "snapshotCount",
              header: t("snapshot:list.snapshotCount"),
              cell: (e: Cloudfront_info) => e.snapshotCount,
            },
            {
              width: 100,
              id: "enabled",
              header: t("snapshot:list.status"),
              cell: (e: Cloudfront_info) => {
                return (
                  <Status
                    status={e.enabled === "true" ? "Enabled" : "Disabled"}
                  />
                );
              },
            },
            {
              width: 150,
              id: "status",
              header: t("snapshot:list.deploying"),
              cell: (e: Cloudfront_info) => {
                return <Status status={e.status || ""} />;
              },
            },
          ]}
          changeSelected={() => {
            // setCloudFrontList(MOCK_CLOUDFRONT_LIST);
          }}
        />
      </div>
    </div>
  );
};

export default Snapshot;
