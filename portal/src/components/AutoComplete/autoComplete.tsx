import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import Autocomplete from "@material-ui/lab/Autocomplete";
import LoadingText from "components/LoadingText";
export interface OptionType {
  name: string;
  value: string;
  description?: string;
}

type AutoCompleteMenuProp = {
  disabled?: boolean;
  value: OptionType | null;
  optionList: OptionType[];
  className?: string;
  placeholder?: string;
  loading?: boolean;
  onChange: (event: any, data: any) => void;
};

const autoComplete: React.FC<AutoCompleteMenuProp> = (
  props: AutoCompleteMenuProp
) => {
  const {
    disabled,
    value,
    loading,
    optionList,
    placeholder,
    className,
    onChange,
  } = props;

  return (
    <div className="gsui-autocomplete-select">
      <SearchIcon className="input-icon" />
      <Autocomplete
        disabled={disabled}
        loading={loading}
        loadingText={<LoadingText text="loading" />}
        className={className}
        options={optionList}
        value={value}
        onChange={(event, data) => onChange(event, data)}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <div ref={params.InputProps.ref}>
            <input
              placeholder={placeholder}
              type="search"
              autoComplete="off"
              {...params.inputProps}
            />
          </div>
        )}
      />
    </div>
  );
};

export default autoComplete;
