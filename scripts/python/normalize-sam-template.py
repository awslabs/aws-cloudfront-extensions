import yaml
import sys

fname = sys.argv[1]
appVersion = sys.argv[2]
print(fname)

with open(fname) as f:
    newfile = yaml.load(f, Loader=yaml.SafeLoader)

newfile["Metadata"]["AWS::ServerlessRepo::Application"]["Author"] = "GCR Solutions"
newfile["Metadata"]["AWS::ServerlessRepo::Application"]["LicenseUrl"] = "s3://aws-cloudfront-extension-lambda-edge/LICENSE.txt"
newfile["Metadata"]["AWS::ServerlessRepo::Application"]["Labels"] = ['gcr','gcr-solutions','cloudfront','cloudfront+','aws-cloudfront-extensions','edge','lambda-edge', 'aws']
newfile["Metadata"]["AWS::ServerlessRepo::Application"]["SemanticVersion"] = appVersion[1:]

with open(fname, "w") as f:
    yaml.dump(newfile, f)