import React from "react";
import { useTranslation } from "react-i18next";

interface SigninProps {
  signOut?: any;
  user?: any;
}

const LHeader: React.FC<SigninProps> = (props: SigninProps) => {
  const { t } = useTranslation();
  return (
    <header className="gsui-header">
      <div className="logo">{t("header.name")}</div>
      <div className="user">
        {t("header.welcome")}, {props.user.attributes.email} (
        <span className="cp sign-out" onClick={props.signOut}>
          {t("header.logout")}
        </span>
        )
      </div>
    </header>
  );
};

export default LHeader;
