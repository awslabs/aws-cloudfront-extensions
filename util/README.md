# Set parameters to lambda edge function

Currently Cloudfront does not support AWS Lambda environment variables. For more information, see the following documentation:
     - http://docs.aws.amazon.com/console/cloudfront/cache-on-selected-headers

The update-lambda-function is used for supporting customer to set parameters during the lambda@edge is deploying.

Follow the steps to enable update-lambda-function feature:
Step 1. Add Parameters into sam template file. Refer [Parameters](../../edge/nodejs/serving-based-on-device/template.yaml)

Step 2. Add a resource of AWS::Serverless::Function into sam template file for creating update-lambda-function lambda function. Refer [UpdateEdgeCodeFunction](../../edge/nodejs/serving-based-on-device/template.yaml) resource. Copy [UpdateEdgeCodeFunction](../../edge/nodejs/serving-based-on-device/template.yaml) and provide following configurations:
	- Resource name
	- DependsOn: Lambda Edge resource name

Step 3. Add a resource of Custom::UpdateConfigCustom into your application sam template file for invoke step 1 function. Refer [UpdateConfigCustom](../../edge/nodejs/serving-based-on-device/template.yaml) resource and provide following configurations:
	- Resource name
	- DependsOn: Resource in step2 
	- ServiceToken: !GetAtt $step2Resource.Arn
	- SourceUrl: 'https://aws-cloudfront-extension-lambda-edge.s3.amazonaws.com/edge/$ApplicationFolder/$ApplicationFolder.zip'
	- EdgeFunctionArn: !GetAtt $LambdaEdgeFunction.Arn
	- HandlerFileName: $LambdaEdgeFunctionHandlerFileName
	- Key: Value

The above "Key" will be replaced by "Value" in your $LambdaEdgeFunctionHandlerFile. Please refer [app.js](../../edge/nodejs/serving-based-on-device/serving-based-on-device/app.js)
	```
	const desktopPath = 'PARA_DESKTOP_PATH';
	```
If you want to replace PARA_DESKTOP_PATH by a customer input parameter. Please add following Key: Value
	```
	PARA_DESKTOP_PATH: !Ref DesktopPathParameter
	```