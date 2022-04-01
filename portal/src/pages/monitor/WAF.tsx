import React from "react";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Button from "components/Button";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "CloudFront Monitoring",
    link: "",
  },
];

const WAF: React.FC = () => {
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <HeaderPanel
        title="Monitoring"
        action={
          <div>
            <Button>Download</Button>
          </div>
        }
      >
        WAF
      </HeaderPanel>
    </div>
  );
};

export default WAF;
