import React, { useState, useEffect, ReactElement } from "react";
import classNames from "classnames";
import LoadingText from "components/LoadingText";
import IndeterminateCheckbox, {
  CHECKED,
  INDETERMINATE,
  UNCHECKED,
} from "components/Checkbox/IndeterminateCheckbox";
import Checkbox from "components/Checkbox/CheckBox";

interface ColumnDefProps {
  id: string;
  header: string;
  width?: number;
  cell: (item: any) => any;
}

enum SelectType {
  CHECKBOX = "checkbox",
  RADIO = "radio",
  NONE = "none",
}

interface TablePanelProps {
  hideHeader?: boolean;
  isReload?: boolean;
  defaultSelectItem?: any[];
  title: string;
  desc?: string;
  className?: string;
  actions: ReactElement;
  selectType: SelectType;
  filter?: ReactElement;
  columnDefinitions: ColumnDefProps[];
  items: any[];
  pagination: ReactElement;
  loading?: boolean;
  changeSelected: (item: any[]) => void;
  loadingText?: string;
  emptyText?: string;
}

const TablePanel: React.FC<TablePanelProps> = (props: TablePanelProps) => {
  const {
    hideHeader,
    isReload,
    defaultSelectItem,
    title,
    desc,
    selectType,
    // className,
    changeSelected,
    columnDefinitions,
    actions,
    filter,
    items,
    pagination,
    loading,
    emptyText,
  } = props;
  const [dataList, setDataList] = useState<any>(items);
  const [selectItemsIds, setSelectItemsIds] = useState<string[]>(
    defaultSelectItem?.map((element) => element.id) || []
  );
  // const [selectItems, setSelectItems] = useState<any>([]);
  const [checkAllStatus, setCheckAllStatus] = useState(UNCHECKED);

  useEffect(() => {
    console.info("items:", items);
    setDataList(items);
    if (items.length === 0) {
      setCheckAllStatus(UNCHECKED);
    }
  }, [items]);

  useEffect(() => {
    console.info("isReloadisReloadisReload:", isReload);
    if (isReload) {
      setSelectItemsIds([]);
    }
  }, [isReload]);

  const handleSelectAll = (e: any) => {
    console.info("e.target.checked:", e.target.checked);
    if (e.target.checked === true) {
      setCheckAllStatus(CHECKED);
      setSelectItemsIds(items.map((item) => item.id));
    } else {
      setCheckAllStatus(UNCHECKED);
      setSelectItemsIds([]);
    }
  };

  const handleClick = (e: any) => {
    const { id, checked } = e.target;
    console.info("e.target.id:", e.target.id);
    console.info("e.target.checked:", e.target.checked);
    console.info(e);
    setSelectItemsIds([...selectItemsIds, id]);
    if (!checked) {
      setSelectItemsIds(selectItemsIds.filter((item) => item !== id));
    }
  };

  useEffect(() => {
    if (selectItemsIds.length >= dataList.length && dataList.length !== 0) {
      setCheckAllStatus(CHECKED);
    } else {
      if (
        selectItemsIds.length > 0 &&
        selectItemsIds.length < dataList.length
      ) {
        setCheckAllStatus(INDETERMINATE);
      } else {
        setCheckAllStatus(UNCHECKED);
      }
    }
    const tmpSelectedItemList: any = [];
    if (selectItemsIds && selectItemsIds.length > 0) {
      items.forEach((element) => {
        if (selectItemsIds.includes(element.id)) {
          tmpSelectedItemList.push(element);
        }
      });
    }
    changeSelected(tmpSelectedItemList);
  }, [selectItemsIds, items]);

  return (
    <div
      className="gsui-table-pannel"
      style={{ paddingTop: hideHeader ? 0 : 10 }}
    >
      {!hideHeader && (
        <div className="table-header">
          <div className="title">{title}</div>
          <div className="action">{actions}</div>
        </div>
      )}

      {desc && <div className="desc">{desc}</div>}
      {!hideHeader && (
        <div className="table-header">
          <div className="filter">{filter}</div>
          <div className="pagination">{pagination}</div>
        </div>
      )}
      <div>
        <div className="gsui-table">
          <div className="gsui-table-header">
            {selectType !== SelectType.NONE && (
              <div className="gsui-table-header-th checkbox">
                <div className="gsui-table-header-th-data">
                  {selectType === SelectType.CHECKBOX && (
                    <IndeterminateCheckbox
                      disabled={loading || false}
                      value={checkAllStatus}
                      onChange={(event) => {
                        handleSelectAll(event);
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {columnDefinitions.map((element, index) => {
              return (
                <div
                  key={index}
                  className="gsui-table-header-th normal"
                  style={{
                    flex: `0 0 ${element.width}px`,
                    // minWidth: element.width,
                  }}
                >
                  <div className="gsui-table-header-th-data">
                    {element.header}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="gsui-table-body-list">
            {dataList.map((element: any, index: number) => {
              return (
                <div
                  onClick={() => {
                    if (selectType === SelectType.RADIO) {
                      changeSelected([element]);
                      setDataList((prev: any) => {
                        const tmpList = JSON.parse(JSON.stringify(prev));
                        tmpList.forEach((tmpItem: any) => {
                          tmpItem.isChecked = false;
                        });
                        tmpList[index].isChecked = true;
                        return tmpList;
                      });
                    }
                  }}
                  key={index}
                  className={classNames("gsui-table-body", {
                    selected:
                      selectItemsIds.includes(element.id) || element.isChecked,
                  })}
                >
                  {selectType !== SelectType.NONE && (
                    <div className="gsui-table-body-td checkbox">
                      <div className="gsui-table-body-td-data">
                        {selectType === SelectType.CHECKBOX && (
                          <Checkbox
                            key={element.id}
                            type="checkbox"
                            name={element.id}
                            id={element.id}
                            handleClick={(e) => {
                              handleClick(e);
                            }}
                            isChecked={selectItemsIds.includes(element.id)}
                          />
                        )}
                        {selectType === SelectType.RADIO && (
                          <input
                            name="tableItem"
                            type="radio"
                            // value={element?.id || ""}
                            checked={element?.isChecked || false}
                            onChange={(event) => {
                              console.info("event:", event);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {columnDefinitions.map((item, index) => {
                    return (
                      <div
                        className="gsui-table-body-td normal"
                        style={{
                          flex: `0 0 ${item.width}px`,
                          // minWidth: element.width,
                        }}
                        key={index}
                      >
                        <div className="gsui-table-body-td-data">
                          {item.cell(element)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {loading && (
              <div className="table-loading">
                <LoadingText text="Loading Data" />
              </div>
            )}
            {!loading && dataList.length === 0 && (
              <div className="table-empty">
                {emptyText ? emptyText : "No Data"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

TablePanel.defaultProps = {
  className: "",
};

// export default TablePanel;
export { SelectType, TablePanel };
