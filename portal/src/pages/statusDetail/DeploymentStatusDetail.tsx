import React, { useState } from "react";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import ValueWithLabel from "components/ValueWithLabel";
import { SelectType, TablePanel } from "components/TablePanel";
import { MOCK_STACK_LIST, StackType } from "mock/data";
import Status from "components/Status/Status";
import Breadcrumb from "components/Breadcrumb";

const DeploymentStatusDetail: React.FC = () => {
  const [stackList, setStackList] = useState(MOCK_STACK_LIST);

  const BreadCrumbList = [
    {
      name: "CloudFront Extensions",
      link: "/",
    },
    {
      name: "Deployment Status",
      link: "/deployment-status",
    },
    {
      name: "Task-01",
    },
  ];
  return (
    <div>
      <Breadcrumb list={BreadCrumbList} />
      <PagePanel title="task2021-12">
        <HeaderPanel title="Deployment settings">
          <div className="flex value-label-span">
            <div className="flex-1">
              <ValueWithLabel label="Deployment ID">task2021-12</ValueWithLabel>
              <ValueWithLabel label="Create date">
                2022-01-22 18:17:20
              </ValueWithLabel>
            </div>
            <div className="flex-1 border-left-c">
              <ValueWithLabel label="CloudFront domain name">
                example.cloudfront.net
              </ValueWithLabel>
              <ValueWithLabel label="CloudFormation stack count">
                3
              </ValueWithLabel>
            </div>
            <div className="flex-1 border-left-c">
              <ValueWithLabel label="Deployment stages">
                <div>
                  <div>Viewer request</div>
                  <div>Origin request</div>
                  <div>Origin response</div>
                </div>
              </ValueWithLabel>
            </div>
          </div>
        </HeaderPanel>

        <HeaderPanel title="Stacks" contentNoPadding>
          <TablePanel
            hideHeader
            title=""
            selectType={SelectType.NONE}
            actions={<div></div>}
            pagination={<div></div>}
            items={stackList}
            columnDefinitions={[
              {
                id: "name",
                header: "Name",
                cell: (e: StackType) => {
                  return <a href="/">{e.name}</a>;
                },
                // sortingField: "alt",
              },
              {
                width: 200,
                id: "status",
                header: "Status",
                cell: (e: StackType) => {
                  return <Status status={e.status} />;
                },
              },
              {
                width: 160,
                id: "version",
                header: "Version",
                cell: (e: StackType) => e.version,
              },
              {
                width: 250,
                id: "tags",
                header: "Tags",
                cell: (e: StackType) => e.created,
              },
            ]}
            changeSelected={() => {
              // setSelectedItems(item);
              setStackList(MOCK_STACK_LIST);
            }}
          />
        </HeaderPanel>
      </PagePanel>
    </div>
  );
};

export default DeploymentStatusDetail;
