/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import React, {
  FC,
  useState,
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
} from "react";
import classNames from "classnames";
import LoadingText from "components/LoadingText";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";

export type ButtonSize = "lg" | "sm";
export type ButtonType =
  | "primary"
  | "default"
  | "danger"
  | "link"
  | "text"
  | "icon"
  | "loading";

interface DropDownListProp {
  text: string;
  id: string;
  disabled?: boolean;
}

interface BaseButtonProps {
  onItemClick: (item: DropDownListProp) => void;
  items: DropDownListProp[];
  className?: string;
  /**设置 Button 的禁用 */
  disabled?: boolean;
  /**设置 Button 的尺寸 */
  size?: ButtonSize;
  /**设置 Button 的类型 */
  btnType?: ButtonType;
  loading?: boolean;
  loadingColor?: string;
  children: React.ReactNode;
  href?: string;
  isI18N?: boolean;
}
type NativeButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLElement>;
type AnchorButtonProps = BaseButtonProps & AnchorHTMLAttributes<HTMLElement>;
export type ButtonProps = Partial<NativeButtonProps & AnchorButtonProps>;
/**
 * 页面中最常用的的按钮元素，适合于完成特定的交互
 * ### 引用方法
 */
export const Button: FC<ButtonProps> = (props) => {
  const {
    onItemClick,
    items,
    btnType,
    className,
    disabled,
    loading,
    loadingColor,
    size,
    children,
    href,
    ...restProps
  } = props;
  // btn, btn-lg, btn-primary
  const classes = classNames("btn", className, {
    [`btn-${btnType}`]: btnType,
    [`btn-${size}`]: size,
    disabled: btnType === "link" && disabled,
  });
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <button className={classes} disabled={true} {...restProps}>
        <LoadingText color={loadingColor ? loadingColor : "#fff"} />
        {children}
      </button>
    );
  } else {
    if (btnType === "link" && href) {
      return (
        <a className={classes} href={href} {...restProps}>
          {children}
        </a>
      );
    } else {
      return (
        <div className="btn-drop-down-wrap">
          <button
            onClick={() => {
              console.info("showDropdown:", showDropdown);
              setShowDropdown(!showDropdown);
            }}
            className={`${classes} btn-drop-down`}
            disabled={disabled}
            {...restProps}
          >
            {children}{" "}
            <span className="dropdown-icon">
              {showDropdown ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
            </span>
          </button>
          {showDropdown && (
            <div className="drop-down-items">
              {items?.map((element, index) => {
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (onItemClick) {
                        onItemClick(element);
                      }
                    }}
                    className="menu-item"
                  >
                    {element.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }
};

Button.defaultProps = {
  disabled: false,
  btnType: "default",
};

export default Button;
