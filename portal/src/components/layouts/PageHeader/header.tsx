import React from "react";

interface SigninProps {
  signOut?: any;
  user?: any;
}

const LHeader: React.FC<SigninProps> = (props: SigninProps) => {
  console.log(props.user);
  return (
    <header className="gsui-header">
      <div className="logo">AWS Solutions</div>
      <div className="user">
        Welcome, {props.user.attributes.email} (
        <span className="cp sign-out" onClick={props.signOut}>
          Sign Out
        </span>
        )
      </div>
    </header>
  );
};

export default LHeader;
