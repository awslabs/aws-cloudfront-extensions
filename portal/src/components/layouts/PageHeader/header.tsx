import React from "react";

const LHeader: React.FC = () => {
  return (
    <header className="gsui-header">
      <div className="logo">AWS Solutions</div>
      <div className="user">
        Welcome, Admin (<span className="cp sign-out">Sign Out</span>)
      </div>
    </header>
  );
};

export default LHeader;
