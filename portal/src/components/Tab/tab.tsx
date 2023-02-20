import React from "react";
import { withStyles, Theme, createStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";

interface StyledTabProps {
  label: string;
}

const AntTabs = withStyles({
  root: {
    borderBottom: "1px solid #d5dbdb",
  },
  indicator: {
    backgroundColor: "#16191f",
  },
})(Tabs);

const AntTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: "none",
      minWidth: 72,
      fontWeight: "bold",
      // borderRight: "1px solid #f00",
      marginRight: theme.spacing(4),
      "&:hover": {
        color: "#ec7211",
        opacity: 1,
      },
      "&$selected": {
        color: "#ec7211",
        fontWeight: "bold",
      },
      "&:focus": {
        color: "#ec7211",
      },
    },
    selected: {},
  })
)((props: StyledTabProps) => <Tab disableRipple {...props} />);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps): JSX.Element => {
  const { children, value, index, ...other } = props;

  return (
    <div
      className="gsui-tab-content"
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {value === index && (
        // <Box p={3}>
        <Typography component={"span"} variant={"body2"}>
          {children}
        </Typography>
        // </Box>
      )}
    </div>
  );
};

export { AntTabs, AntTab, TabPanel };
