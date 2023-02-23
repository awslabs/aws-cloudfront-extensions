import React from "react";

interface PagePanelProps {
  className?: string;
  title: string;
  desc?: string;
  actions?: React.ReactChild;
  children?: React.ReactChild | React.ReactChild[];
}

export const PagePanel: React.FC<PagePanelProps> = (props: PagePanelProps) => {
  const { title, desc, actions, children } = props;

  // btn, btn-lg, btn-primary
  return (
    <div className="gsui-page-panel">
      <div className="title">
        <div className="page-title">{title}</div>
        <div className="actions">{actions}</div>
      </div>
      {desc && <div className="page-desc">{desc}</div>}
      <div>{children}</div>
    </div>
  );
};

PagePanel.defaultProps = {
  className: "",
};

export default PagePanel;
