'use strict'

//---- ENVIRONMENT VARIABLES ----//

/// AWS Region 
const TABLE_REGION = (process.env.TABLE_REGION == null) ? 'us-east-1' : process.env.TABLE_REGION
/// Name of the black ip  table 
const TABLE_NAME = (process.env.TABLE_NAME == null) ? 'black_ip_list' : process.env.TABLE_NAME
/// Ips of black 
const WAFV2_IPSETS = (process.env.WAFV2_IPSETS == null) ? '[]' : process.env.WAFV2_IPSETS
/// Duration of black 
const BLOCK_PERIOD = (process.env.BLOCK_PERIOD == null) ? 4*60*60*1000 : process.env.BLOCK_PERIOD

/// ipset on WAFv2
const IPSETS = JSON.parse(WAFV2_IPSETS);

/// request region
const { AWS_REGION } = process.env.AWS_REGION;

const https = require('https');

const replicatedRegions = {
    'us-east-1': true,
    'us-west-2': false,
    'eu-central-1': false,
    'ap-southeast-1': false,
    'ap-northeast-1': false,
    'ap-east-1': false
};

const timeElapsed = Date.now();
const today = new Date(timeElapsed);

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-10-08',
    region: replicatedRegions[AWS_REGION] ? AWS_REGION : TABLE_REGION,
    //sslEnabled: false, 
    paramValidation: false,
    convertResponseTypes: false,
    httpOptions: {
        agent: new https.Agent({
            keepAlive: true,
        }),
    },
})
const wafv2 = new AWS.WAFV2({ apiVersion: '2019-07-29' });

function getIp(request) {
    return request.clientIp;
}

async function queryIpSet(blockTime, pageSize, lastEvaluatedKey) {
    let params = {
        TableName: TABLE_NAME,
        IndexName: "secondIndex-createAt-index",
        KeyConditionExpression: "secondIndex = :pk and createAt > :sk",
        ExpressionAttributeValues: {
            ":sk": blockTime,
            ":pk": '1'
        },
        Limit: pageSize,
        ScanIndexForward: false
    };
    if (lastEvaluatedKey != null) {
        params.ExclusiveStartKey = lastEvaluatedKey;
    }
    return await ddb.query(params).promise();
}

async function createIps(tableName, ip) {
    let params = {
        TableName: tableName,
        Item: {
            "ip": ip,
            "createAt": timeElapsed,
            "secondIndex": "2",
            "ttl": timeElapsed + 48 * 60 * 60 * 1000
        }
    }
    return await ddb.put(params).promise();
}

function isIPv4Address(address) {
    let blocks = address.split(".");
    if (blocks.length === 4) {
        return blocks.every(function (block) {
            return !isNaN(block) && parseInt(block, 10) >= 0 && parseInt(block, 10) <= 255;
        });
    }
    return false;
}

function isLastPage(isFirst, lastEvaluatedKey){
    return (isFirst!=0)&&(lastEvaluatedKey == null)
}

exports.handler = async (event) => {

    let ipSetsCount = IPSETS.length;
    // console.log("ipset count: "+JSON.stringify(IPSETS.length));
    let lastEvaluatedKey = null
    for (let j = 0; j < ipSetsCount; j++) {
        if(isLastPage(j, lastEvaluatedKey)){
            // console.log("last page number: " + j);
        }
        let ips = {};
        ips = await queryIpSet(timeElapsed - BLOCK_PERIOD, 10000, lastEvaluatedKey);
        
         if (typeof(ips.LastEvaluatedKey) !== 'undefined') {
            lastEvaluatedKey = ips.LastEvaluatedKey;
        }

        let blackips = [];

        for (let i = 0; i < ips.Count; i++) {
            let order = Number(i);
            if (order >= ips.Count) {
                // console.log(`"order: " + order +" j: ${j} i:${i}  "`);
                break;
            }

            let ipV = ips.Items[order].ip;
            if (isIPv4Address(ipV)) {
                blackips.push(ipV + "/32");
            }

        }

        let params2 = {
            Id: IPSETS[j].set,
            Name: IPSETS[j].name,
            Scope: 'CLOUDFRONT'
        }
        if (j > 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        let ipsetInfo = await wafv2.getIPSet(params2).promise();
        let lt = ipsetInfo.LockToken;
        //console.log("getIPsets"+ JSON.stringify(ipsetInfo));
        let params = {
            Addresses: blackips,
            Id: IPSETS[j].set,
            LockToken: lt,
            Name: IPSETS[j].name,
            Scope: 'CLOUDFRONT',
            Description: 'update ipset'
        };
        if (j > 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        try{
            let updateResult = await wafv2.updateIPSet(params).promise();
        } catch(e) {
            console.log('catched'+e);
            await wafv2.updateIPSet(params).promise();
        }
    }
}