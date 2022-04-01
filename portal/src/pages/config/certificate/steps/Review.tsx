import HeaderPanel from "components/HeaderPanel";
import React from "react";

const ParametersList = [{ key: "stage", value: "prod" }];

const Review: React.FC = () => {
  return (
    <div>
      <HeaderPanel title="CName" contentNoPadding>
        <div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">www.example.com</div>
          </div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">www.example1.com</div>
          </div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">www.example2.com</div>
          </div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">www.example3.com</div>
          </div>
        </div>
      </HeaderPanel>
      <HeaderPanel title="Certification to import" contentNoPadding>
        <div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">SampleCertificationImported</div>
          </div>
        </div>
      </HeaderPanel>
      <HeaderPanel title="Tags" contentNoPadding>
        <div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">
              <b>Key</b>
            </div>
            <div className="tag-value flex-1">
              <b>Value</b>
            </div>
          </div>
          {ParametersList.map((tag, index) => {
            return (
              <div key={index} className="flex gsui-show-tag-list">
                <div className="tag-key">{tag?.key}</div>
                <div className="tag-value flex-1">{tag?.value}</div>
              </div>
            );
          })}
        </div>
      </HeaderPanel>
    </div>
  );
};

export default Review;
