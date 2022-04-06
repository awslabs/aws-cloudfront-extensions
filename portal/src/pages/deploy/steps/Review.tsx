import HeaderPanel from "components/HeaderPanel";
import React from "react";

const ParametersList = [{ key: "View request", value: "anti-hotlinking" }];

const AntiHotList = [
  { key: "Allow list", value: "*.example.com; *.example.org" },
];

const Review: React.FC = () => {
  return (
    <div>
      <HeaderPanel title="Parameters" contentNoPadding>
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

      <HeaderPanel title="Parameters - anti-hotlinking" contentNoPadding>
        <div>
          <div className="flex gsui-show-tag-list">
            <div className="tag-key">
              <b>Key</b>
            </div>
            <div className="tag-value flex-1">
              <b>Value</b>
            </div>
          </div>
          {AntiHotList.map((tag, index) => {
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
