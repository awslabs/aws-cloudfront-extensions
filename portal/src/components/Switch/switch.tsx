import React from "react";

interface SwithProps {
  label: string;
  desc: string;
  isOn: boolean;
  handleToggle: () => void;
}

const Alert: React.FC<SwithProps> = (props: SwithProps) => {
  const { label, desc, isOn, handleToggle } = props;
  return (
    <div className="gsui-switch">
      <div className="flex">
        <div className="title">{label}</div>
        <div className="switch-container">
          <input
            checked={isOn}
            onChange={handleToggle}
            className="react-switch-checkbox"
            id={label}
            type="checkbox"
          />
          <label
            style={{ background: isOn ? "#0073BB" : "" }}
            className="react-switch-label"
            htmlFor={label}
          >
            <span className={`react-switch-button`} />
          </label>
        </div>
      </div>
      <div className="desc">{desc}</div>
    </div>
  );
};

export default Alert;
