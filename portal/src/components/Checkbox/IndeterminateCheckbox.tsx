import React, { useRef, useEffect } from "react";

export const CHECKED = 1;
export const UNCHECKED = 2;
export const INDETERMINATE = -1;

interface InteCheckBoxProp {
  disabled: boolean;
  value: number;
  onChange: (event: any) => void;
}

const IndeterminateCheckbox: React.FC<InteCheckBoxProp> = (props: any) => {
  const { disabled, value, onChange, ...otherProps } = props;
  const checkRef: any = useRef();

  useEffect(() => {
    console.info("value:", value);
    checkRef.current.checked = value === CHECKED;
    checkRef.current.indeterminate = value === INDETERMINATE;
  }, [value]);

  return (
    <input
      disabled={disabled}
      onChange={onChange}
      color="primary"
      type="checkbox"
      ref={checkRef}
      {...otherProps}
    />
  );
};
export default IndeterminateCheckbox;
