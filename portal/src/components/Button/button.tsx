import React, { FC, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import classNames from "classnames";
import LoadingText from "components/LoadingText";

export type ButtonSize = "lg" | "sm";
export type ButtonType =
  | "primary"
  | "default"
  | "danger"
  | "link"
  | "text"
  | "icon"
  | "loading";

interface BaseButtonProps {
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
        <button className={classes} disabled={disabled} {...restProps}>
          {children}
        </button>
      );
    }
  }
};

Button.defaultProps = {
  disabled: false,
  btnType: "default",
};

export default Button;
