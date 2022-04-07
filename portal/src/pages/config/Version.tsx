import React, { useEffect, useState } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { Pagination } from "@material-ui/lab";
import RefreshIcon from "@material-ui/icons/Refresh";
import Status from "components/Status/Status";
import TextInput from "components/TextInput";
import { Link } from "react-router-dom";
import { appSyncRequestQuery } from "assets/js/request";
import { cf_list } from "graphql/queries";
import { Cloudfront_info } from "../../API";

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
  const [cloudFrontList, setCloudFrontList] = useState<Cloudfront_info[]>([]);
  const [searchParams, setSearchParams] = useState("");

  // Get Distribution List
  const getCloudfrontDistributionList = async () => {
    setCloudFrontList([]);
    try {
      // setLoadingData(true);
      // setServiceLogList([]);
      const resData = await appSyncRequestQuery(cf_list, {});
      const cfList: Cloudfront_info[] = resData.data.cf_list;
      setCloudFrontList(cfList);
    } catch (error) {
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
              width: 150,
              id: "Id",
              header: "ID",
              cell: (e: Cloudfront_info) => {
                return (
                  <Link to={`/config/vesrsion/detail/${e.id}`}>{e.id}</Link>
                );
              },
            },
            {
              width: 200,
              id: "domain",
              header: "Domain",
              cell: (e: Cloudfront_info) => e.domainName,
            },
            {
              width: 150,
              id: "versionCount",
              header: "Version count",
              cell: (e: Cloudfront_info) => e.versionCount,
            },
            {
              width: 150,
              id: "status",
              header: "Status",
              cell: (e: Cloudfront_info) => {
                return <Status status={e.status || ""} />;
              },
            },
          ]}
          changeSelected={() => {
            // setCloudFrontList(MOCK_CLOUDFRONT_LIST);
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
