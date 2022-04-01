import React from "react";
import { InfoBarTypes } from "reducer/appReducer";
import InfoSpan from "components/InfoSpan";

interface ValueLabelProps {
  hasInfo?: boolean;
  infoType?: InfoBarTypes;
  label: string;
  children: React.ReactChild;
}

const ValueWithLabel: React.FC<ValueLabelProps> = (props: ValueLabelProps) => {
  const { hasInfo, infoType, label, children } = props;
  return (
    <div className="gsui-value-label">
      <div className="gsui-value-label_label">
        {label}
        {hasInfo && <InfoSpan spanType={infoType} />}
      </div>
      <div className="gsui-value-label_value">{children}</div>
    </div>
  );
};

export default ValueWithLabel;
