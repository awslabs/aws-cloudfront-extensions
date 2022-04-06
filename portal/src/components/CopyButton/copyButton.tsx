import React from "react";
import FilterNoneIcon from "@material-ui/icons/FilterNone";
import Popper from "@material-ui/core/Popper";
import { CopyToClipboard } from "react-copy-to-clipboard";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Button from "components/Button";

interface CopyButtonProps {
  text: string;
  children: React.ReactChild;
}

const CopyButton: React.FC<CopyButtonProps> = (props: CopyButtonProps) => {
  const { text, children } = props;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event: any) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };
  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;
  return (
    <div className="gsui-copy-button">
      <ClickAwayListener
        onClickAway={() => {
          setAnchorEl(null);
        }}
      >
        <CopyToClipboard text={text}>
          <Button btnType="default" aria-describedby={id} onClick={handleClick}>
            <FilterNoneIcon className="copy-icon" fontSize="small" /> {children}
          </Button>
        </CopyToClipboard>
      </ClickAwayListener>
      <Popper id={id} placement="top" open={open} anchorEl={anchorEl}>
        <div className="gsui-copy-pop-over">Copied</div>
      </Popper>
    </div>
  );
};

export default CopyButton;
