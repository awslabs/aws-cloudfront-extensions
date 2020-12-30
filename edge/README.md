# Publish edge applications to Serverless Application Repository

The "publish-apps.json" file is used for marking the list of applications that need to be published to Serverless Application Repository. Please add the applications relative path into file to trigger github application publishing workflow.

##Example
```javascript
{
  "edge": {
    "publish_app_path": [
      "nodejs/serving-based-on-device"
    ],
    "tag": "v1.0.5"
  }
}
```

The serving-based-on-device application need to be published and also add the tag "v1.0.5" for current version.

# Share edge applications to all accounts

The "share-apps.json" file is used for marking the list of applications that need to be shared to all accounts. Please add the applications arn into file to trigger github share-apps workflow.

##Example
```javascript
{
  "edge": {
    "apps_arn": [
      "arn:aws:serverlessrepo:us-east-1:418289889111:applications/serving-based-on-device"
    ]
  }
}
```

The serving-based-on-device application need to be shared to all accounts.
