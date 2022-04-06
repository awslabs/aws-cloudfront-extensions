import React from "react";
import Button from "components/Button";
import TextInput from "components/TextInput";

interface TagInput {
  key: string;
  value: string;
}

interface TagListProps {
  tagList: TagInput[];
  addTag: () => void;
  onChange: (index: number, key: string, value: string) => void;
  removeTag: (index: number) => void;
  tagLimit?: number;
}

const TagList: React.FC<TagListProps> = (props: TagListProps) => {
  const { tagList, tagLimit = 50, addTag, removeTag, onChange } = props;
  return (
    <div className="gsui-tag-list">
      {tagList.length === 0 && (
        <div className="no-tag-tips pd-10">
          No tags associated with the resource.
        </div>
      )}
      {tagList.length > 0 && (
        <div>
          <div className="flex">
            <div className="flex-1 key t-title">Key</div>
            <div className="flex-1 value t-title">
              Value - <i>Optional</i>
            </div>
            <div className="remove t-title">&nbsp;</div>
          </div>
          {tagList.map((element, index) => {
            return (
              <div className="flex" key={index}>
                <div className="flex-1 key">
                  <TextInput
                    placeholder="Enter key"
                    value={element.key || ""}
                    onChange={(event) => {
                      onChange(index, event.target.value, element.value || "");
                    }}
                  />
                </div>
                <div className="flex-1 value">
                  <TextInput
                    placeholder="Enter value"
                    value={element.value || ""}
                    onChange={(event) => {
                      onChange(index, element.key || "", event.target.value);
                    }}
                  />
                </div>
                <div className="remove">
                  <Button
                    onClick={() => {
                      removeTag(index);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {tagList.length < tagLimit && (
        <div className="pd-10">
          <Button onClick={addTag}>Add new tag</Button>
          <div className="add-tag-tips">
            You can add up to {tagLimit - tagList.length} more tags.
          </div>
        </div>
      )}
    </div>
  );
};

export default TagList;
