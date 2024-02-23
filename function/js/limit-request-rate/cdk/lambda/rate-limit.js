/// TABLE Region 
const TABLE_REGION =   'us-east-1'
/// Name of the Ip Rate table 
const TABLE_NAME = (process.env.TABLE_NAME == null) ? 'cf-country-mobile-rate-limit' : process.env.TABLE_NAME
/// Name of the block Ip table 
const IP_TABLE_NAME = (process.env.IP_TABLE_NAME == null) ? 'black-ip-list' : process.env.IP_TABLE_NAME

/// allowed nation
const ALLOWED_COUNTRY = (process.env.ALLOWED_COUNTRY == null) ? 'KH,CN,HK,MY,PH,SA,TH,VN,UA,SG,MM' : process.env.ALLOWED_COUNTRY

/// Windows duration, default value: 1 minutes 
const WINDOW_PERIOD_IN_SECONDS = (process.env.WINDOW_PERIOD_IN_SECONDS == null) ? 1 * 60 * 1000 : Number(process.env.WINDOW_PERIOD_IN_SECONDS) * 1000

/// GLOBAL_RATE
const GLOBAL_RATE = (process.env.GLOBAL_RATE == null) ? 'GLOBAL_RATE_RRRRR' : Number(process.env.GLOBAL_RATE)

/// URL_RATE
const URL_RATE = (process.env.URL_RATE == null) ? 'URL_RATE_RRRRR' : Number(process.env.URL_RATE)

/// URL_LIST
const URL_LIST = (process.env.URL_LIST == null) ? 'URL_LIST_RRRRR' : Number(process.env.URL_LIST)

/// Duration of black ， 4 hours
const BLOCK_PERIOD = (process.env.BLOCK_PERIOD == null) ? 4*60*60*1000 : process.env.BLOCK_PERIOD

/// dynamodb global tables enabled region
const DDB_GLOBAL_TABLE_REGIONS = (process.env.DDB_GLOBAL_TABLE_REGIONS == null) ? 'DDB_GLOBAL_TABLE_REGIONS_RRRRR' : process.env.DDB_GLOBAL_TABLE_REGIONS


/// request region
const AWS_REGION = process.env.AWS_REGION;
console.log('AWS_REGION: ' + AWS_REGION + "\nprocess.env.AWS_REGION: " + process.env.AWS_REGION);
const RegionsMap =
{
    'us-east-2': 'us',
    'us-east-1': 'us',
    'us-west-1': 'us',
    'us-west-2': 'us',
    'af-south-1': 'africa',
    'ap-east-1': 'asia',
    'ap-south-2': 'asia',
    'ap-southeast-3': 'asia',
    'ap-southeast-4': 'asia',
    'ap-south-1': 'asia',
    'ap-northeast-3': 'asia',
    'ap-northeast-2': 'asia',
    'ap-southeast-1': 'asia',
    'ap-southeast-2': 'asia',
    'ap-northeast-1': 'asia',
    'ca-central-1': 'us',
    'eu-central-1': 'eu',
    'eu-west-1': 'eu',
    'eu-west-2': 'eu',
    'eu-south-1': 'eu',
    'eu-west-3': 'eu',
    'eu-south-2': 'eu',
    'eu-north-1': 'eu',
    'eu-central-2': 'eu',
    'il-central-1': 'me',
    'me-south-1': 'me',
    'me-central-1': 'me',
    'sa-east-1': 'us'
}

let regionsEnabled = {
    'us': false,
    'us-region': [],
    'asia': false,
    'asia-region': [],
    'eu': false,
    'eu-region': [],
    'me': false,
    'me-region': [],
    'africa': false,
    'africa-region': []
}
const https = require('https');

const replicatedRegions = {
  'us-east-1': true,
  'us-west-2': false,
  'eu-central-1': false,
  'ap-southeast-1': false,
  'ap-northeast-1': false,
  'ap-east-1': false
}

const timeElapsed = Date.now();
const today = new Date(timeElapsed);

    function rateLimit () {
    return {
      status: '429',
      statusDescription: 'Too Many Requests'
    }
}

function blackList () {
    return {
      status: '403',
      statusDescription: 'In blacklist'
    }
}

function originLambdaErr () {
    return {
      status: '501',
      statusDescription: 'internal error'
    }
}

function calcDynamoDBRegion () {
    let DdbRegions = DDB_GLOBAL_TABLE_REGIONS.split(',');
    for (let r of DdbRegions) {
        let geo = RegionsMap[r];
        regionsEnabled[geo] = true;
        const geoRegion = geo+'-region';
        let rList = regionsEnabled[geoRegion];
        regionsEnabled[geoRegion].push(r);
    }
    console.log(`regionsEnabled map: ${JSON.stringify(regionsEnabled)}`);
    if (regionsEnabled[RegionsMap[process.env.AWS_REGION]]){
        //random index
        const list = regionsEnabled[RegionsMap[process.env.AWS_REGION]+'-region']
        const randomIndex = Math.floor(Math.random() * list.length);
        console.log('onboarding region: ' + list[randomIndex]);
        return list[randomIndex]
    }else{
        console.log('onboarding region: us-east-1');
        return 'us-east-1'
    }
} 

const AWS = require('aws-sdk')
const ddb = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-10-08',
    region: calcDynamoDBRegion(),
    //sslEnabled: false, 
    paramValidation: false, 
    convertResponseTypes: false,
    httpOptions: {
        agent: new https.Agent({
          keepAlive: true,
        }),
    },
})

function getIp(request){
    return request.clientIp;
}

function getUA(request){
    if(request.headers['user-agent'] != null) {
        return request.headers['user-agent'][0].value;
    }else{
        return "unknown";
    }
}

function isInWhiteList(request){
    return (request.headers['x-amzn-waf-customer-wlist'] != null && request.headers['x-amzn-waf-customer-wlist'][0].value == "ip_whitelist") 
}

function isMobileClient(request){
    return (request.headers['cloudfront-is-ios-viewer'] != null && request.headers['cloudfront-is-ios-viewer'][0].value == "true") 
    || (request.headers['cloudfront-is-android-viewer'] != null && request.headers['cloudfront-is-android-viewer'][0].value == "true");
}

function isIosClient(request){
    return (request.headers['cloudfront-is-ios-viewer'] != null && request.headers['cloudfront-is-ios-viewer'][0].value == "true");
}

function isAndroidClient(request){
    return (request.headers['cloudfront-is-android-viewer'] != null && request.headers['cloudfront-is-android-viewer'][0].value == "true");
}

//cloudfront-is-tablet-viewer

function isTabletClient(request){
    return (request.headers['cloudfront-is-tablet-viewer'] != null && request.headers['cloudfront-is-tablet-viewer'][0].value == "true");
}

function getCountry(request){
    if(request.headers['cloudfront-viewer-country'] != null) {
        return request.headers['cloudfront-viewer-country'][0].value;
    }
    return "unknown";
}

function isInAllowedCountry(request){
    if(request.headers['cloudfront-viewer-country'] != null) {
        let countryCode = getCountry(request);
        let countries = ALLOWED_COUNTRY.split(',');
        return countries.indexOf(countryCode) != -1;
    }
    return false;
}

function accessLogFactory(req){
    return {
        ip:getIp(req),
        createAt: Date.now(),
        ua: getUA(req),
        url: req.uri,
        from: AWS_REGION,
        country: getCountry(req),
        secIndex: today.toLocaleDateString(),
        ttl: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // in 24 hours
    }
}

//DDB operation
async function createItem (tableName,accessRecord) {
    let params = {
        TableName : tableName,
        Item: accessRecord
    }
    return await ddb.put(params).promise();    
}

async function createIps (tableName,ip) {
    let params = {
        TableName : tableName,
        Item: {
            "ip":ip,
            "createAt":timeElapsed,
            "secondIndex":"1",
            "ttl": Math.floor((timeElapsed + 48*60*60*1000)/1000)
            }
    }
    return await ddb.put(params).promise();    
}

async function queryIps (tableName, ip, startTime) {
    let params = {
        TableName : tableName,
        KeyConditionExpression: "#pKey = :pKey and #createAt >= :windowTime",
        ExpressionAttributeNames: {
          "#pKey": "ip",
          "#createAt":"createAt"
        },
        ExpressionAttributeValues: {
            ":pKey": ip,
            ":windowTime": startTime
        },
        //Limit: pageSize,
        ScanIndexForward: false
    }
    
    return await ddb.query(params).promise();
    
}

async function queryItems (tableName, ip, windowTime) {
    let params = {
        TableName : tableName,
        KeyConditionExpression: "#pKey = :pKey and #createAt >= :windowTime",
        ExpressionAttributeNames: {
          "#pKey": "ip",
          "#createAt":"createAt"
        },
        ExpressionAttributeValues: {
            ":pKey": ip,
            ":windowTime": windowTime
        },
        //Limit: pageSize,
        ScanIndexForward: false
    }
    
    return await ddb.query(params).promise();
    
}

async function isBlocked(ip){
    let ips = await queryIps(IP_TABLE_NAME, ip, (timeElapsed-BLOCK_PERIOD));
    // console.log(JSON.stringify(ips))
    return (ips.Count != null && ips.Count >0)
}

function getUri(request){
    return request.uri;
}

// /website-images
// /data/info
const urlMatchCount = (array, url) => {
    return array.filter((item) => {console.log('item url'+ item.url);return (item.url.indexOf(url) != -1)}).length;
};

exports.handler =  async function (event, context, callback) {

    const request = event.Records[0].cf.request
    if(isInWhiteList(request)){
        callback(null, request);
        return;
    }
    if(await isBlocked(getIp(request))) {
        callback(null, rateLimit());
        return;
    }
    

    let uri = getUri(request)
    let ipUrlCount = {}
    ipUrlCount = await queryItems(TABLE_NAME, getIp(request), (Date.now() - WINDOW_PERIOD_IN_SECONDS))
    let urlList = URL_LIST.split(',');
    for(let u in urlList){
         console.log("url1: " +uri +' u: ' + urlList[u]);
        if(uri.indexOf(urlList[u]) != -1){
        let rate = Number(URL_RATE);
         if(ipUrlCount.Count == null || (ipUrlCount.Count >0 && urlMatchCount(ipUrlCount.Items, uri) >= rate)){
            await createIps(IP_TABLE_NAME,getIp(request));
            callback(null, rateLimit());
            return;
         }
        }
    }
    
    let ipCount = {}
    ipCount = await queryItems(TABLE_NAME, getIp(request), (Date.now() - WINDOW_PERIOD_IN_SECONDS))
    let LimitRate = Number(GLOBAL_RATE);
    console.log("LimitRate:" + LimitRate);
    let urlCount = 0
    if(ipCount.Count == null || (ipCount.Count-urlCount) >= LimitRate){
        await createIps(IP_TABLE_NAME,getIp(request));
        callback(null, rateLimit());
    } else {
        await createItem(TABLE_NAME, accessLogFactory(request))
        callback(null, request);
    }

}

