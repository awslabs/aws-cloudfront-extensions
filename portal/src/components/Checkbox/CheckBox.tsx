import React from "react";

interface CheckBoxProps {
  id: string;
  type: string;
  name: string;
  handleClick: (event: any) => void;
  isChecked: boolean;
}

const Checkbox: React.FC<CheckBoxProps> = (props: CheckBoxProps) => {
  const { id, type, name, handleClick, isChecked } = props;
  return (
    <input
      id={id}
      name={name}
      type={type}
      onChange={handleClick}
      checked={isChecked}
    />
  );
};

export default Checkbox;
