import React, { useState, useEffect } from "react";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import { SelectType, TablePanel } from "components/TablePanel";
import { Pagination } from "@material-ui/lab";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useNavigate, useParams } from "react-router-dom";
import { Version } from "API";
import { appSyncRequestQuery } from "assets/js/request";
import { getDistributionCname, listCloudfrontVersions } from "graphql/queries";
import LoadingText from "../../../components/LoadingText";
import { useTranslation } from "react-i18next";

const VersionDetail: React.FC = () => {
  const navigate = useNavigate();
  const [versionFilterList, setVersionFilterList] = useState<Version[]>([]);
  const [versionList, setVersionList] = useState<Version[]>([]);
  const [versionWithNotesList, setVersionWithNotesList] = useState<Version[]>(
    []
  );
  const [withNote, setWithNote] = useState(true);
  const [withNoteText, setWithNoteText] = useState("button.versionWithNote");
  const [selectedItem, setSelectedItem] = useState<Version[]>([]);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [detailDisabled, setDetailDisabled] = useState(false);
  const [compareDisabled, setCompareDisabled] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [distributionId, setDistributionId] = useState<any>("");
  const [distributionAliases, setDistributionAliases] = useState<string[]>([]);
  const { id } = useParams();
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
      name: id || "",
    },
  ];

  // Get Version List By Distribution
  const getVersionListByDistribution = async () => {
    try {
      setDistributionId(id || "");
      setLoadingData(true);
      setVersionList([]);
      const resData = await appSyncRequestQuery(listCloudfrontVersions, {
        distribution_id: id,
      });
      const versionList: Version[] = resData.data.listCloudfrontVersions;
      const versionWithNoteList: Version[] = versionList.filter(
        (version) => version.note !== ""
      );
      setLoadingData(false);
      setVersionList(versionList);
      setVersionFilterList(versionList);
      setVersionWithNotesList(versionWithNoteList);
    } catch (error) {
      setLoadingData(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getVersionListByDistribution();
  }, []);

  // get alias by Distribution
  const getCloudfrontAliases = async () => {
    try {
      const resData = await appSyncRequestQuery(getDistributionCname, {
        distribution_id: id,
      });
      const result: string[] = resData.data.getDistributionCname;
      setDistributionAliases(result);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getCloudfrontAliases();
  }, []);

  useEffect(() => {
    if (selectedItem.length > 0) {
      if (selectedItem.length === 1) {
        setSaveDisabled(false);
        setDetailDisabled(false);
        setCompareDisabled(true);
      } else if (selectedItem.length === 2) {
        setSaveDisabled(true);
        setDetailDisabled(true);
        setCompareDisabled(false);
      } else {
        setSaveDisabled(true);
        setDetailDisabled(true);
        setCompareDisabled(true);
      }
    } else {
      setSaveDisabled(true);
      setDetailDisabled(true);
      setCompareDisabled(true);
    }
  }, [selectedItem]);

  return (
    <div>
      <Breadcrumb list={BreadCrunbList} />
      <div className="mt-10">
        <TablePanel
          loading={loadingData}
          title={
            distributionId + "(" + (distributionAliases[0] || "No CName") + ")"
          }
          selectType={SelectType.CHECKBOX}
          actions={
            <div>
              <Button
                onClick={() => {
                  getVersionListByDistribution();
                }}
              >
                {loadingData ? (
                  <LoadingText />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </Button>

              <Button
                disabled={saveDisabled}
                onClick={() => {
                  const path =
                    "/config/version/detail/" +
                    id +
                    "/" +
                    selectedItem[0].versionId +
                    "/save" +
                    "/" +
                    selectedItem[0].note;
                  navigate(path);
                }}
              >
                {t("button.updateVersionNote")}
              </Button>

              <Button
                disabled={detailDisabled}
                onClick={() => {
                  const path =
                    "/config/version/detail/display/" +
                    id +
                    "/" +
                    selectedItem[0].versionId;
                  navigate(path);
                }}
              >
                {t("button.details")}
              </Button>
              <Button
                onClick={() => {
                  if (withNote) {
                    setVersionFilterList(versionWithNotesList);
                    setWithNoteText("button.allVersion");
                    setWithNote(false);
                  } else {
                    setVersionFilterList(versionList);
                    setWithNoteText("button.versionWithNote");
                    setWithNote(true);
                  }
                }}
              >
                {t(withNoteText)}
              </Button>
              <Button
                disabled={compareDisabled}
                btnType="primary"
                onClick={() => {
                  const path =
                    "/config/version/detail/" +
                    id +
                    "/compare/" +
                    selectedItem[0].versionId +
                    "/" +
                    selectedItem[1].versionId;
                  navigate(path);
                }}
              >
                {t("button.compare")}
              </Button>
            </div>
          }
          pagination={<Pagination />}
          items={versionFilterList}
          columnDefinitions={[
            {
              width: 150,
              id: "id",
              header: t("version:versions.versionId"),
              cell: (e: Version) => {
                const path =
                  "/config/version/detail/display/" + id + "/" + e.versionId;
                return <a href={path}>{e.versionId}</a>;
              },
            },
            {
              width: 300,
              id: "date",
              header: t("version:versions.date"),
              cell: (e: Version) => e.dateTime,
            },

            {
              // width: 200,
              id: "tags",
              header: t("version:versions.versionNote"),
              cell: (e: Version) => e.note,
            },
          ]}
          // filter={
          //   <div>
          //     <TextInput
          //       value={searchParams}
          //       isSearch={true}
          //       placeholder={"Search all versions"}
          //       onChange={(event) => {
          //         console.info("event:", event);
          //         setSearchParams(event.target.value);
          //       }}
          //     />
          //   </div>
          // }
          changeSelected={(item) => {
            setSelectedItem(item);
          }}
        />
      </div>
    </div>
  );
};

export default VersionDetail;
