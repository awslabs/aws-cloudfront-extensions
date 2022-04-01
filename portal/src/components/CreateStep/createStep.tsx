import React from "react";

type StepType = {
  name: string;
};
interface CreateStepProps {
  className?: string;
  activeIndex: number;
  selectStep: (step: number) => void;
  list: StepType[];
}

export const CreateStep: React.FC<CreateStepProps> = (
  props: CreateStepProps
) => {
  const { list, activeIndex, selectStep } = props;
  return (
    <div className="gsui-create-step">
      <nav>
        <ul>
          {list.map((element, index) => {
            return (
              <li key={index}>
                <small>Step {index + 1}</small>
                <div className="step-name">
                  <span
                    onClick={() => {
                      selectStep(index);
                    }}
                    className={activeIndex !== index ? "link" : ""}
                  >
                    {element.name}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default CreateStep;
