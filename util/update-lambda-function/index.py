import cfnresponse
import os
import boto3
import json
from io import BytesIO
from urllib.request import urlopen
import zipfile
from pathlib import Path

def handler(event, context):
    print (str(event))
    responseData = {}
    specialKey = ['ServiceToken', 'EdgeFunctionArn', 'SourceUrl', 'HandlerFileName']
    try: 
        if (event['RequestType'] == 'Create') or (event['RequestType'] == 'Update'):
            print("unzip source Zip to local directory")
            baseDir = '/tmp/gcrsolution/updateConfig/'
            SourceUrl = event['ResourceProperties']['SourceUrl'].replace(" ", "")
            print("baseDir=" + baseDir)
            with urlopen(SourceUrl) as zipresp:
              with zipfile.ZipFile(BytesIO(zipresp.read())) as zfile:
                zfile.extractall(baseDir)
            HandlerFileName = event['ResourceProperties']['HandlerFileName'].replace(" ", "")
            print("read " + HandlerFileName)
            appjs = Path(baseDir + HandlerFileName).read_text() 
            # replace values
            for key in event['ResourceProperties'].keys():
                if key not in specialKey : 
                    print("replace value: " + key)              
                    appjs = appjs.replace(key, event['ResourceProperties'][key])

            print("save app.js back to disk")
            with open(baseDir + HandlerFileName,"w") as w:
                w.write(appjs)
            print("zip up the directory")
            zipHandle = zipfile.ZipFile('/tmp/tmpEdgeSource.zip', 'w', compression = zipfile.ZIP_DEFLATED)
            addDirToZip(zipHandle, baseDir, baseDir)
            zipHandle.close()
            with open('/tmp/tmpEdgeSource.zip', 'rb') as file_data:
                bytes_content = file_data.read()
            lambdaClient = boto3.client('lambda')            
            lambdaClient.update_function_code(
                FunctionName=event['ResourceProperties']['EdgeFunctionArn'].replace(" ", ""),
                ZipFile=bytes_content)            
            responseData['Status'] = 'SUCCESS'
            cfnresponse.send(event, context, cfnresponse.SUCCESS, responseData, "CustomResourcePhysicalID")
            print ('SUCCESS')
        else:
            print("SUCCESS - operation not Create or Update, ResponseData=" + str(responseData))
            cfnresponse.send(event, context, cfnresponse.SUCCESS, responseData, "CustomResourcePhysicalID")
    except Exception as e:
        responseData['Error'] = str(e)
        cfnresponse.send(event, context, cfnresponse.FAILED, responseData, "CustomResourcePhysicalID") 
        print("FAILED ERROR: " + responseData['Error'])
def addDirToZip(zipHandle, path, basePath=""):
    basePath = basePath.rstrip("\\/") + ""
    basePath = basePath.rstrip("\\/")
    for root, dirs, files in os.walk(path):
        zipHandle.write(os.path.join(root, "."))
        for file in files:
            filePath = os.path.join(root, file)
            inZipPath = filePath.replace(basePath, "", 1).lstrip("\\/")
            zipHandle.write(filePath, inZipPath)
