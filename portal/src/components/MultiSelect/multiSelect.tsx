import React, { useState, useEffect } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import InputBase from "@material-ui/core/InputBase";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import LoadingText from "components/LoadingText";
import CloseIcon from "@material-ui/icons/Close";
import Button from "components/Button";
import { SelectItem } from "components/Select/select";

export const MenuProps: any = {
  getContentAnchorEl: null,
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "left",
  },
};

const usePlaceholderStyles = makeStyles(() => ({
  placeholder: {
    color: "#aaa",
  },
}));

const Placeholder = ({ children }: any) => {
  const classes = usePlaceholderStyles();
  return <div className={classes.placeholder}>{children}</div>;
};

const BootstrapInput = withStyles((theme) => ({
  root: {
    "label + &": {
      marginTop: theme.spacing(3),
    },
  },
  input: {
    borderRadius: 2,
    position: "relative",
    backgroundColor: theme.palette.background.paper,
    border: "1px solid #aab7b8",
    fontSize: 14,
    padding: "6px 10px 6px 10px",
    // transition: theme.transitions.create(["border-color", "box-shadow"]),
    // Use the system font instead of the default Roboto font.
    "&:focus": {
      borderRadius: 2,
      borderColor: "#aab7b8",
      // boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
    },
  },
}))(InputBase);

interface SelectProps {
  optionList: SelectItem[];
  placeholder?: string;
  className?: string;
  loading?: boolean;
  value: string[];
  onChange: (event: any) => void;
  hasRefresh?: boolean;
  clickRefresh?: () => void;
}

const MultiSelect: React.FC<SelectProps> = (props: SelectProps) => {
  const {
    optionList,
    placeholder,
    loading,
    className,
    value,
    onChange,
    hasRefresh,
    clickRefresh,
  } = props;
  // console.info("optionList:", optionList);
  const [selected, setSelected] = useState<string[]>(value);
  // teamMates: []

  const handleChange = (event: any) => {
    setSelected(event.target.value);
    onChange(event.target.value);
  };

  useEffect(() => {
    if (value?.length <= 0) {
      setSelected([]);
    } else {
      setSelected(value);
    }
  }, [value]);

  return (
    <div className={`flex gsui-multi-select-wrap ${className}`}>
      <div className="flex-1">
        <Select
          className="gsui-multi-select"
          multiple
          displayEmpty
          value={selected}
          onChange={handleChange}
          input={<BootstrapInput />}
          MenuProps={MenuProps}
          renderValue={() => <Placeholder>{placeholder}</Placeholder>}
        >
          {loading ? (
            <div className="pd-10">
              <LoadingText text="loading" />
            </div>
          ) : (
            optionList.map((element, index) => (
              <MenuItem
                key={index}
                value={element.value}
                style={{ margin: 0, padding: 0 }}
              >
                <div
                  style={{
                    display: "block",
                    padding: "8px 10px 8px 35px",
                    cursor: "pointer",
                  }}
                >
                  {/* <Checkbox /> */}
                  <input
                    onChange={(event) => {
                      // console.info(event);
                    }}
                    style={{ position: "absolute", margin: "6px 0 0 -20px" }}
                    type="checkbox"
                    checked={selected.indexOf(element.value) > -1}
                  />
                  {element.name} {element.optTitle}
                </div>
              </MenuItem>
            ))
          )}
        </Select>
        <div>
          {optionList &&
            optionList.length > 0 &&
            selected.map((item: string, index: number) => {
              return (
                <div className="gsui-multi-select-item-box" key={index}>
                  <div className="item-content">
                    <div className="item-title">
                      {optionList.find((element) => element.value === item)
                        ?.optTitle || ""}
                    </div>
                    <div>{item}</div>
                  </div>
                  <div
                    className="icon-remove"
                    onClick={() => {
                      const tmpSelected = JSON.parse(JSON.stringify(selected));
                      tmpSelected.splice(selected.indexOf(item), 1);
                      setSelected(tmpSelected);
                      onChange(tmpSelected);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {hasRefresh && (
        <div className="refresh-button">
          <Button
            disabled={loading}
            btnType="icon"
            onClick={() => {
              if (loading) {
                return;
              }
              if (clickRefresh) {
                clickRefresh();
              }
            }}
          >
            {loading ? <LoadingText /> : <RefreshIcon fontSize="small" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
