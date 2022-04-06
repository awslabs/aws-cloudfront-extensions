import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { MOCK_REPOSITORY_LIST, RepositoryType } from "mock/data";
import { Pagination } from "@material-ui/lab";
import { useNavigate } from "react-router-dom";
import TextInput from "components/TextInput";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Extensions repository",
    link: "",
  },
];

const Repository: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState("");
  const [extentionList, setExtentionList] = useState<RepositoryType[]>([]);

  useEffect(() => {
    setExtentionList(MOCK_REPOSITORY_LIST);
  }, []);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          title="Extensions"
          selectType={SelectType.RADIO}
          actions={
            <div>
              <Button>Check updates</Button>
              <Button
                btnType="primary"
                onClick={() => {
                  navigate("/extentions/deploy");
                }}
              >
                Deploy
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={extentionList}
          columnDefinitions={[
            {
              width: 250,
              id: "name",
              header: "Name",
              cell: (e: RepositoryType) => e.name,
              // sortingField: "alt",
            },
            {
              id: "desc",
              header: "Description",
              cell: (e: RepositoryType) => e.desc,
            },
            {
              width: 120,
              id: "version",
              header: "Version",
              cell: (e: RepositoryType) => e.version,
            },
            {
              width: 160,
              id: "stage",
              header: "CloudFront Stage",
              cell: (e: RepositoryType) => e.stage,
            },
            {
              width: 150,
              id: "tags",
              header: "Tags",
              cell: (e: RepositoryType) => e.tags,
            },
          ]}
          filter={
            <div>
              <TextInput
                value={searchParams}
                isSearch={true}
                placeholder={"Search all extentions"}
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
            // setExtentionList(MOCK_REPOSITORY_LIST);
          }}
        />
      </div>
    </div>
  );
};

export default Repository;
