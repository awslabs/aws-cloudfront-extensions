import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { CNameType, MOCK_CNAME_LIST } from "mock/data";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "components/Breadcrumb";
import { SelectType, TablePanel } from "components/TablePanel";
import Button from "components/Button";
import { Pagination } from "@material-ui/lab";
import TextInput from "components/TextInput";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "CName Status",
    link: "",
  },
];

const CNameList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState("");
  const [cnameList, setCnameList] = useState<CNameType[]>([]);

  useEffect(() => {
    setCnameList(MOCK_CNAME_LIST);
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          title="CName status"
          selectType={SelectType.RADIO}
          actions={
            <div>
              <Button>
                <RefreshIcon fontSize="small" />
              </Button>
              <Button
                onClick={() => {
                  navigate("/404");
                }}
              >
                View Details
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={cnameList}
          columnDefinitions={[
            {
              width: 200,
              id: "hostName",
              header: "Hostnamne",
              cell: (e: CNameType) => e.hostName,
              // sortingField: "alt",
            },
            {
              id: "sslStatus",
              header: "SSL/TLS Status",
              cell: (e: CNameType) => e.sslStatus,
            },
            {
              width: 160,
              id: "certExpireOn",
              header: "Certificate expires on",
              cell: (e: CNameType) => e.certExpireOn,
            },
            {
              width: 160,
              id: "distribution",
              header: "CloudFront distribution",
              cell: (e: CNameType) => e.distribution,
            },
            {
              width: 160,
              id: "expireOn",
              header: "Expires on",
              cell: (e: CNameType) => e.expireOn,
            },
            {
              width: 150,
              id: "tags",
              header: "Tags",
              cell: (e: CNameType) => e.tags,
            },
          ]}
          filter={
            <div>
              <TextInput
                value={searchParams}
                isSearch={true}
                placeholder={"Search all distribution"}
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

export default CNameList;
