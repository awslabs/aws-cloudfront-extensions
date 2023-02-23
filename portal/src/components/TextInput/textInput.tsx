import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import classNames from "classnames";
type DefautlProps = React.HTMLAttributes<HTMLInputElement>;

type TextInputProp = {
  type?: string;
  value: string;
  isSearch?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (event: any) => void;
};

const TextInput: React.FC<TextInputProp & DefautlProps> = (
  props: TextInputProp & DefautlProps
) => {
  const {
    type,
    value,
    placeholder,
    className,
    disabled,
    isSearch,
    readonly,
    onChange,
    ...defaultProps
  } = props;

  return (
    <div
      className={classNames(
        "gsui-textinput",
        { "is-search": isSearch },
        className
      )}
    >
      {isSearch && <SearchIcon className="input-icon" />}
      <input
        {...defaultProps}
        readOnly={readonly}
        disabled={disabled}
        value={value}
        type={type ? type : "text"}
        onWheel={(event) => event.currentTarget.blur()}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event);
        }}
      />
    </div>
  );
};

export default TextInput;
