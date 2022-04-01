import React from "react";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

interface ExtLinkProps {
  to: string;
  children: React.ReactChild | React.ReactChild[];
  internalList?: string[];
}

const extLink: React.FC<ExtLinkProps> = (props: ExtLinkProps) => {
  const { to, children, internalList } = props;
  const INTERNAL_LINK_LIST = internalList || [];

  if (to.startsWith("http") || INTERNAL_LINK_LIST.indexOf(to) >= 0) {
    return (
      <a target="_blank" className="gsui-extlink" href={to} rel="noreferrer">
        {children}
        <OpenInNewIcon className="icon" fontSize="small" />
      </a>
    );
  }
  return (
    <a
      target="_blank"
      className="gsui-extlink"
      href={`//${to}`}
      rel="noreferrer"
    >
      {children}
      <OpenInNewIcon className="icon" fontSize="small" />
    </a>
  );
};

export default extLink;
