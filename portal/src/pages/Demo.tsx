import React, { useState } from "react";
import AutoComplete from "components/AutoComplete";
import Alert from "components/Alert";
import Breadcrumb from "components/Breadcrumb";
import Button from "components/Button";
import ExtLink from "components/ExtLink";
import HeaderPanel from "components/HeaderPanel";
import InfoSpan from "components/InfoSpan";
import { InfoBarTypes } from "reducer/appReducer";
import LoadingText from "components/LoadingText";
import CopyButton from "components/CopyButton";
import CopyText from "components/CopyText";
import CreateStep from "components/CreateStep";
import FormItem from "components/FormItem";
import TextInput from "components/TextInput";
import Modal from "components/Modal";
import PagePanel from "components/PagePanel";
import Status from "components/Status/Status";
import { AntTab, AntTabs, TabPanel } from "components/Tab";
import TagList from "components/TagList";
import TextArea from "components/TextArea";
import Tiles from "components/Tiles";
import ValueWithLabel from "components/ValueWithLabel";

const Demo: React.FC = () => {
  const [autoCompleteValue, SetAutoCompleteValue] = useState<any>();
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [inputText, setInputText] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState("");
  const [tileValue, setTileValue] = useState("AUTO");
  return (
    <div>
      <div>Breadcrumb:</div>
      <Breadcrumb
        list={[{ name: "Home", link: "/" }, { name: "Solution Name" }]}
      />
      <div>Alert:</div>
      <Alert content="smaple alert" />
      <div className="mt-10">AutoComplete:</div>
      <AutoComplete
        onChange={(event, data) => {
          console.info(event, data);
          SetAutoCompleteValue(data);
        }}
        value={autoCompleteValue}
        optionList={[
          {
            name: "a",
            value: "a",
            description: "c",
          },
        ]}
      />
      <div className="mt-10">Button:</div>
      <Button btnType="primary">Button Name</Button>
      <div className="mt-10">ExtLink</div>
      <ExtLink to="/">Link Name</ExtLink>
      <div className="mt-10">HeaderPanel:</div>
      <HeaderPanel title="Panel">
        <div>Panel Content</div>
      </HeaderPanel>
      <div>InfoSpan:</div>
      <InfoSpan spanType={InfoBarTypes.ALARMS} />
      <div className="mt-10">Loading Text:</div>
      <LoadingText text="Loading Data" />
      <div className="mt-10">Copy Button</div>
      <CopyButton text="copy data">Click to Copy</CopyButton>
      <div className="mt-10">Copy Text</div>
      <CopyText text="copyText">Copy Text</CopyText>
      <div className="mt-10">Create Step</div>
      <CreateStep
        activeIndex={activeStep}
        selectStep={(step) => {
          setActiveStep(step);
        }}
        list={[{ name: "Config Network" }, { name: "Specify Setting" }]}
      />
      <div className="mt-10">Form Item:</div>
      <FormItem
        optionTitle="This is the form item title"
        optionDesc="Form item a long description"
        errorText="This is error Text"
        infoText="This is info text"
      >
        <TextInput
          value={inputText}
          onChange={(event) => {
            console.info(event);
            setInputText(event.target.value);
          }}
        />
      </FormItem>
      <div className="mt-10">Modal:</div>
      <div>
        <Button
          onClick={() => {
            setOpenModal(true);
          }}
        >
          Open Modal
        </Button>
        <Modal
          title="Modal Sample"
          isOpen={openModal}
          fullWidth={false}
          closeModal={() => {
            setOpenModal(false);
          }}
          actions={
            <div>
              <Button
                btnType="primary"
                onClick={() => {
                  setOpenModal(false);
                }}
              >
                Confirm
              </Button>
            </div>
          }
        >
          <div className="gsui-modal-content">
            This is the modal description This is the modal descriptionThis is
            the modal description
          </div>
        </Modal>
      </div>
      <div className="mt-10">Page Panel:</div>
      <div>
        <PagePanel title="This a page title" />
      </div>
      <div className="mt-10">Status:</div>
      <div>
        <Status status="Active" />
      </div>
      <div className="mt-10">Tab:</div>
      <div>
        <AntTabs
          value={activeTab}
          onChange={(event, newTab) => {
            console.info(event, newTab);
            setActiveTab(newTab);
          }}
        >
          <AntTab label="Tab One" />
          <AntTab label="Tab Two" />
        </AntTabs>
        <TabPanel value={activeTab} index={0}>
          <div className="pd-lr-10">Tab One Content</div>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <div className="pd-lr-10">Tab Two Content</div>
        </TabPanel>
      </div>
      <div className="mt-10">Tag List:</div>
      <TagList
        tagList={[]}
        addTag={() => {
          console.info("add");
        }}
        removeTag={(e) => {
          console.info(e);
        }}
        onChange={(e) => {
          console.info(e);
        }}
      />
      <div className="mt-10">TextInput:</div>
      <div>
        <TextInput
          value={textAreaValue}
          onChange={(event) => {
            setTextAreaValue(event.target.value);
          }}
        />
      </div>

      <div className="mt-10">TextArea:</div>
      <div>
        <TextArea
          rows={3}
          value={textAreaValue}
          onChange={(event) => {
            setTextAreaValue(event.target.value);
          }}
        />
      </div>

      <div className="mt-10">Tiles:</div>
      <div>
        <Tiles
          name="demo"
          value={tileValue}
          onChange={(event) => {
            setTileValue(event.target.value);
          }}
          items={[
            {
              label: "Auto",
              description: "Auto Description",
              value: "AUTO",
            },
            {
              label: "Manual",
              description: "Manual Description",
              value: "MANUAL",
            },
          ]}
        />
      </div>

      <div className="mt-10">Value and labels:</div>
      <div>
        <ValueWithLabel label="Title">Label Value</ValueWithLabel>
      </div>
    </div>
  );
};

export default Demo;
