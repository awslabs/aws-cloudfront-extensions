import classNames from "classnames";
import React from "react";

type TilesItemProps = {
  disabled?: boolean;
  label: string;
  description: string;
  value: string;
};

interface TilesProps {
  name: string;
  className?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  items: TilesItemProps[];
}

const Tiles: React.FC<TilesProps> = (props: TilesProps) => {
  const { name, items, onChange, value } = props;

  return (
    <div className="gsui-tiles-wrap">
      {items.map((item, index) => {
        return (
          <label
            key={index}
            className={classNames({
              active: item.value === value,
              disabled: item.disabled,
            })}
          >
            <div className="name">
              <input
                disabled={item.disabled}
                checked={item.value === value}
                onChange={onChange}
                value={item.value}
                type="radio"
                name={name}
              />
              <span>{item.label}</span>
            </div>
            <div className="desc">{item.description}</div>
          </label>
        );
      })}
    </div>
  );
};

Tiles.defaultProps = {
  className: "",
};

export default Tiles;
