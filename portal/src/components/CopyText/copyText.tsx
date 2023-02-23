import React from "react";
import FilterNoneIcon from "@material-ui/icons/FilterNone";
import Popper from "@material-ui/core/Popper";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

interface CopyTextProps {
  text: string;
  children: React.ReactChild;
}

const CopyText: React.FC<CopyTextProps> = (props: CopyTextProps) => {
  const { text, children } = props;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event: any) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };
  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;
  return (
    <div className="gsui-copy-text">
      <ClickAwayListener
        onClickAway={() => {
          setAnchorEl(null);
        }}
      >
        <CopyToClipboard text={text}>
          <button
            aria-describedby={id}
            type="button"
            onClick={handleClick}
            className="copy-icon"
          >
            <FilterNoneIcon fontSize="small" />
          </button>
        </CopyToClipboard>
      </ClickAwayListener>
      {children}
      <Popper id={id} placement="top" open={open} anchorEl={anchorEl}>
        <div className="gsui-copy-pop-over">Copied!</div>
      </Popper>
    </div>
  );
};

export default CopyText;
