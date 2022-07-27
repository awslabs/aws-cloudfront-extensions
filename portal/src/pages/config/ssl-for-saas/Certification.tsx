import React from "react";
import Breadcrumb from "components/Breadcrumb";
import PagePanel from "components/PagePanel";
import HeaderPanel from "components/HeaderPanel";
import ExtLink from "components/ExtLink";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";

const BreadCrunbList = [
  {
    name: "CloudFront Extensions",
    link: "/",
  },
  {
    name: "Certification settings",
    link: "",
  },
];

const Certification: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <PagePanel title="Certification management">
        <div className="home-box">
          <div className="box-item">
            <div className="sub-title">Description 1</div>
            <div>
              Configure multiple origin servers and multiple cache behaviors
              based on URL path patterns on your website. Use AWS origins such
              as Amazon S3 or Elastic Load Balancing, and add your own custom
              origins to the mix.
            </div>
            <div className="mt-10">
              <ExtLink to="/">Learn more</ExtLink>
            </div>
          </div>
          <div className="box-item">
            <div className="sub-title">Description 2</div>
            <div>
              Use CloudFront to deliver on-demand video without the need to set
              up or operate any media servers. CloudFront supports multiple
              protocols for media streaming.
            </div>
            <div className="mt-10">
              <ExtLink to="/">Learn more</ExtLink>
            </div>
          </div>
        </div>
        <div className="mt-20">
          <HeaderPanel title="Use cases" contentNoPadding>
            <div className="home-box">
              <div className="box-item">
                <div className="sub-title">Use case 1</div>
                <div>
                  Use Amazon S3 to store the content that CloudFront delivers.
                </div>
              </div>
              <div className="box-item">
                <div className="sub-title">Use case 2</div>
                <div>
                  Use Amazon Route 53 to route DNS queries for your domain name
                  to your CloudFront distribution.
                </div>
              </div>
            </div>
          </HeaderPanel>
        </div>
        <div className="button-action text-right">
          <Button
            btnType="primary"
            onClick={() => {
              navigate("/config/certification/list");
            }}
          >
            List Certification
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              navigate("/config/certification/create");
            }}
          >
            Create or Import Certification
          </Button>
        </div>
      </PagePanel>
    </div>
  );
};

export default Certification;
