"use strict";

const cacheAge = "PARA_AGE";
const botPara = "PARA_ROBOT_LIST";

exports.handler = (event, context, callback) => {
  let response = event.Records[0].cf.response;
  let request = event.Records[0].cf.request;
  let agentList = request.headers["user-agent"];
  let botList = botPara.split(",");

  for (let i = 0; i < agentList.length; i++) {
    let agent = agentList[i].value.toLowerCase();
    console.log("User agent: " + agent);

    for (let j = 0; j < botList.length; j++) {
      if (agent.includes(botList[j].trim())) {
        console.log("Bot detected, update cache control header: " + botList[j]);
        // Set the cache-control header
        response.headers["cache-control"] = [
          {
            key: "cache-control",
            value: cacheAge,
          },
        ];
        callback(null, response);
      }
    }
  }

  callback(null, response);
};
