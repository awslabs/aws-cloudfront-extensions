import React from "react";
import classNames from "classnames";

type TextAreaProp = {
  type?: string;
  rows: number;
  value: string;
  isSearch?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  tips?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (event: any) => void;
};

const TextArea: React.FC<TextAreaProp> = (props: TextAreaProp) => {
  const {
    value,
    rows,
    placeholder,
    className,
    disabled,
    readonly,
    tips,
    onChange,
  } = props;

  return (
    <div className={classNames("gsui-textarea", className)}>
      <textarea
        rows={rows}
        readOnly={readonly}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event);
        }}
      />
      {tips && <div className="text-area-tips">{tips}</div>}
    </div>
  );
};

export default TextArea;
