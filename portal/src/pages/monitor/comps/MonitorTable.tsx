import React from "react";

export interface KeyValueType {
  key: string;
  value: string;
}

interface MonitorTableProps {
  showSelect?: boolean;
  keyName?: string;
  valueName?: string;
  dataKey?: string;
  dataValue?: string;
  list: KeyValueType[];
  curCountryCode?: string;
  changeCountryCode?: (code: string) => void;
}

export const MonitorTable: React.FC<MonitorTableProps> = (
  props: MonitorTableProps
) => {
  const {
    showSelect,
    dataKey,
    dataValue,
    keyName,
    valueName,
    list,
    curCountryCode,
    changeCountryCode,
  } = props;
  return (
    <div className="monitor-table">
      <table width="100%" cellPadding={2} cellSpacing={2}>
        {list.length > 0 && (
          <thead>
            <tr>
              {showSelect && <th className="select">&nbsp;</th>}
              <th>{keyName || "Key"}</th>
              <th>{valueName || "Value"}</th>
            </tr>
          </thead>
        )}
        <tbody>
          {list.length > 0 ? (
            list.map((element: any, index: number) => {
              return (
                <tr
                  onClick={() => {
                    changeCountryCode && changeCountryCode(element.key);
                  }}
                  key={index}
                  className={
                    curCountryCode && element.key === curCountryCode
                      ? "checked"
                      : ""
                  }
                >
                  {showSelect && (
                    <td className="select">
                      <input
                        value={element.key}
                        checked={element.key === curCountryCode}
                        type="radio"
                        onChange={(e) => {
                          console.info(e);
                        }}
                      />
                    </td>
                  )}
                  <td>
                    <div className="key">
                      {dataKey ? element[dataKey] : element.key}
                    </div>
                  </td>
                  <td>
                    <div className="table-value">
                      {dataValue ? element[dataValue] : element.value}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={showSelect ? 3 : 2}>
                <div className="no-data">No Data</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
