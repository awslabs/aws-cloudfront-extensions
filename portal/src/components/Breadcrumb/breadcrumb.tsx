import React from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Typography from "@material-ui/core/Typography";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";

type BreadcrumbType = {
  name: string;
  link?: string;
};

interface BreadcrumbProps {
  list: BreadcrumbType[];
}

const breadcrumb: React.FC<BreadcrumbProps> = (props: BreadcrumbProps) => {
  const { list } = props;
  return (
    <div className="bread-crumb">
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={<NavigateNextIcon fontSize="medium" />}
      >
        {list.map((element, index) => {
          if (element.link) {
            return (
              <Link key={index} color="inherit" to={element.link}>
                {element.name}
              </Link>
            );
          } else {
            return (
              <Typography key={index} color="textPrimary">
                {element.name}
              </Typography>
            );
          }
        })}
      </Breadcrumbs>
    </div>
  );
};

export default breadcrumb;
