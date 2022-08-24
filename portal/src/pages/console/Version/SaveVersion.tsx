import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import FormItem from "components/FormItem";
import HeaderPanel from "components/HeaderPanel";
import PagePanel from "components/PagePanel";
import TextInput from "components/TextInput";
import TextArea from "components/TextArea";
import Button from "components/Button";
import { useNavigate, useParams } from "react-router-dom";
import { appSyncRequestQuery } from "assets/js/request";
import { updateConfigTag } from "graphql/queries";
import { useTranslation } from "react-i18next";

const SaveVersion: React.FC = () => {
  const [distribution, setDistribution] = useState<any>("");
  const [versionDesc, setVersionDesc] = useState<any>("");
  const { id } = useParams<string>();
  const { version } = useParams<string>();
  const { note } = useParams<string>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("version:name"),
      link: "/config/version",
    },
    {
      name: distribution,
      link: "/config/version/detail/" + distribution,
    },
    {
      name: t("version:save.name"),
    },
  ];

  const myLog = () => {
    setDistribution(id);
    setVersionDesc(note || "");
  };

  useEffect(() => {
    myLog();
  }, []);

  // Get Version List By Distribution
  const updateDistConfigTag = async (
    distId: string,
    ver: string,
    note: string
  ) => {
    try {
      await appSyncRequestQuery(updateConfigTag, {
        distribution_id: distId,
        version: ver,
        note: note,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="m-w-800">
        <PagePanel title={t("version:save.title")}>
          <HeaderPanel title={t("version:save.versionSetting")}>
            <div className="m-w-75p">
              <FormItem optionTitle={t("distribution")} optionDesc="">
                <TextInput
                  disabled
                  value={distribution}
                  onChange={(event) => {
                    setDistribution(event.target.value);
                  }}
                />
              </FormItem>
              <FormItem optionTitle={t("version:save.note")} optionDesc="">
                <TextArea
                  placeholder={t("version:save.betaTesting")}
                  rows={2}
                  value={versionDesc}
                  onChange={(event) => {
                    setVersionDesc(event.target.value);
                  }}
                />
              </FormItem>
            </div>
          </HeaderPanel>

          <div className="button-action text-right">
            <Button
              onClick={() => {
                navigate("/config/version/detail/" + id);
              }}
            >
              {t("button.cancel")}
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                const dist_id: any = id;
                const ver: any = version;
                updateDistConfigTag(dist_id, ver, versionDesc);
                navigate("/config/version/detail/" + id);
              }}
            >
              {t("button.save")}
            </Button>
          </div>
        </PagePanel>
      </div>
    </div>
  );
};

export default SaveVersion;
