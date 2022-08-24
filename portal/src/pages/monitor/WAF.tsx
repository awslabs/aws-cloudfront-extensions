import React from "react";
import Breadcrumb from "components/Breadcrumb";
import HeaderPanel from "components/HeaderPanel";
import Button from "components/Button";
import { useTranslation } from "react-i18next";

const WAF: React.FC = () => {
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("monitor:waf.name"),
      link: "",
    },
  ];
  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <HeaderPanel
        title="Monitoring"
        action={
          <div>
            <Button>{t("button.download")}</Button>
          </div>
        }
      >
        WAF
      </HeaderPanel>
    </div>
  );
};

export default WAF;
