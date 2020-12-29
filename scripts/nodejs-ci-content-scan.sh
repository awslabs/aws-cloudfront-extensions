#! /bin/bash
 
export language="$(cut -d'/' -f1 <<<"$labelName")"
export appName="$(cut -d'/' -f2 <<<"$labelName")"

# scan commit content
aws s3 cp s3://aws-solutions-build-assets/viperlight-scanner/viperlight.zip .

unzip -q viperlight.zip -d ./viperlight

./viperlight/bin/viperlight-scan -t edge/$labelName





