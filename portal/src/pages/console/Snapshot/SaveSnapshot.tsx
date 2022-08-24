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
import { updateConfigSnapshotTag } from "graphql/queries";
import { useTranslation } from "react-i18next";

const SaveSnapshot: React.FC = () => {
  const [distribution, setDistribution] = useState<any>("");
  const [snapshotDesc, setSnapshotDesc] = useState<any>("");
  const { id } = useParams<string>();
  const { snapshot } = useParams<string>();
  const { note } = useParams<string>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const BreadCrunbList = [
    {
      name: t("name"),
      link: "/",
    },
    {
      name: t("snapshot:configSnapshot"),
      link: "/config/snapshot",
    },
    {
      name: distribution,
      link: "/config/snapshot/detail/" + distribution,
    },
    {
      name: t("snapshot:save.name"),
    },
  ];

  const myLog = () => {
    setDistribution(id);
    setSnapshotDesc(note || "");
  };

  useEffect(() => {
    myLog();
  }, []);

  // Get Snapshot List By Distribution
  const updateDistConfigSnapshotTag = async (
    distId: string,
    snapshot_name: string,
    note: string
  ) => {
    try {
      await appSyncRequestQuery(updateConfigSnapshotTag, {
        distribution_id: distId,
        snapshot_name: snapshot_name,
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
        <PagePanel title={t("snapshot:save.saveNote")}>
          <HeaderPanel title={t("snapshot:save.setting")}>
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
              <FormItem optionTitle={t("snapshot:save.desc")} optionDesc="">
                <TextArea
                  placeholder={t("snapshot:save.betaTest")}
                  rows={2}
                  value={snapshotDesc}
                  onChange={(event) => {
                    setSnapshotDesc(event.target.value);
                  }}
                />
              </FormItem>
            </div>
          </HeaderPanel>

          <div className="button-action text-right">
            <Button
              onClick={() => {
                navigate("/config/snapshot/detail/" + id);
              }}
            >
              {t("button.cancel")}
            </Button>
            <Button
              btnType="primary"
              onClick={() => {
                const dist_id: any = id;
                const snapshot_name: any = snapshot;
                updateDistConfigSnapshotTag(
                  dist_id,
                  snapshot_name,
                  snapshotDesc
                );
                navigate("/config/snapshot/detail/" + id);
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

export default SaveSnapshot;
