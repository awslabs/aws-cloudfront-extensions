import { ExtensionType } from "API";
import HeaderPanel from "components/HeaderPanel";
import React from "react";
import { useTranslation } from "react-i18next";
import { DeployExtensionObj } from "../Deploy";

interface ReviewProps {
  deployExtensionObj: DeployExtensionObj;
}

const Review: React.FC<ReviewProps> = (props: ReviewProps) => {
  const { deployExtensionObj } = props;
  const { t } = useTranslation();
  return (
    <div>
      {deployExtensionObj.type !== ExtensionType.Lambda && (
        <HeaderPanel
          title={t("repository:deploy.review.param")}
          contentNoPadding
        >
          <div>
            <div className="flex gsui-show-tag-list">
              <div className="tag-key">
                <b>{t("repository:deploy.review.key")}</b>
              </div>
              <div className="tag-value flex-1">
                <b>{t("repository:deploy.review.value")}</b>
              </div>
            </div>
            <div className="flex gsui-show-tag-list">
              <div className="tag-key">
                {t("repository:deploy.review.distributionId")}
              </div>
              <div className="tag-value flex-1">
                {deployExtensionObj.distributionObj?.value}
              </div>
            </div>
            <div className="flex gsui-show-tag-list">
              <div className="tag-key">
                {t("repository:deploy.review.behaviors")}
              </div>
              <div className="tag-value flex-1">
                {deployExtensionObj.behaviorArr.join(", ")}
              </div>
            </div>
            <div className="flex gsui-show-tag-list">
              <div className="tag-key">
                {t("repository:deploy.review.cfStage")}
              </div>
              <div className="tag-value flex-1">{deployExtensionObj.stage}</div>
            </div>
          </div>
        </HeaderPanel>
      )}

      {deployExtensionObj.paramList.length > 0 && (
        <HeaderPanel
          title={`Parameters - ${deployExtensionObj.name}`}
          contentNoPadding
        >
          <div>
            <div className="flex gsui-show-tag-list">
              <div className="tag-key">
                <b>{t("repository:deploy.review.key")}</b>
              </div>
              <div className="tag-value flex-1">
                <b>{t("repository:deploy.review.value")}</b>
              </div>
            </div>
            {deployExtensionObj.paramList.map((element, index) => {
              return (
                <div key={index} className="flex gsui-show-tag-list">
                  <div className="tag-key">{element.key}</div>
                  <div className="tag-value flex-1">{element.value}</div>
                </div>
              );
            })}
          </div>
        </HeaderPanel>
      )}
    </div>
  );
};

export default Review;
