import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { LinearProgress } from "@material-ui/core";

const BorderLinearProgress = makeStyles(() => ({
  root: {
    height: 5,
    backgroundColor: "rgba(255,255,255, 0.4)",
  },
  bar: {
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255, 0.9)",
  },
}));

const ProgressBar = (props: any) => {
  const classesBorderLinearProgress = BorderLinearProgress();

  const { value } = props;

  return (
    <React.Fragment>
      <LinearProgress
        classes={classesBorderLinearProgress}
        variant="determinate"
        color="secondary"
        value={value || 0}
      />
    </React.Fragment>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
};

export default ProgressBar;
