import React from "react";
import { ReactElement } from "react";
import classNames from "classnames";
import { InfoBarTypes } from "reducer/appReducer";
import InfoSpan from "../InfoSpan";

interface HeaderPanelProps {
  hasInfo?: boolean;
  infoLink?: string;
  infoType?: InfoBarTypes;
  count?: number;
  className?: string;
  action?: ReactElement;
  title: string;
  desc?: string;
  children?: React.ReactChild | React.ReactChild[];
  contentNoPadding?: boolean;
  marginBottom?: number;
}

export const HeaderPanel: React.FC<HeaderPanelProps> = (
  props: HeaderPanelProps
) => {
  const {
    hasInfo,
    infoLink,
    infoType,
    title,
    count,
    desc,
    action,
    children,
    contentNoPadding,
    marginBottom,
  } = props;

  // btn, btn-lg, btn-primary
  return (
    <div className="gsui-header-panel" style={{ marginBottom: marginBottom }}>
      <div className="header">
        <div className="header-title">
          <div className="sub-title">
            {title}
            {count ? <span>({count})</span> : ""}
            {hasInfo && !infoLink && <InfoSpan spanType={infoType} />}
            {hasInfo && infoLink && (
              <a href={infoLink} target="_blank" rel="noreferrer">
                <InfoSpan spanType={undefined} />
              </a>
            )}
          </div>
          {desc && <div className="sub-desc">{desc}</div>}
        </div>
        {action && <div className="action">{action}</div>}
      </div>
      <div
        className={classNames({
          content: true,
          "no-padding": contentNoPadding,
        })}
      >
        {children}
      </div>
    </div>
  );
};

HeaderPanel.defaultProps = {
  className: "",
};

export default HeaderPanel;
