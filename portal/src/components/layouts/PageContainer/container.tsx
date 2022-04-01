import HelpPanel from "components/HelpPanel";
import React from "react";
import SideMenu from "../../SideMenu";

interface ContainerProps {
  hideHelpPanel?: boolean;
  disablePadding?: boolean;
  children: React.ReactChild | React.ReactChild[];
}

const container: React.FC<ContainerProps> = (props: ContainerProps) => {
  const { children, hideHelpPanel, disablePadding } = props;
  return (
    <main className="gsui-main">
      <div className="gsui-main-content">
        <SideMenu />
        <div className="gsui-container">
          <div className={disablePadding ? "" : "gsui-content"}>{children}</div>
        </div>
        {!hideHelpPanel && <HelpPanel />}
      </div>
    </main>
  );
};

export default container;
