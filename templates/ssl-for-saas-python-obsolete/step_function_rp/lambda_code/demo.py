import os
import json
import subprocess
import re

from django.db import router
import boto3 

# certificate need to create in region us-east-1 for cloudfront to use
acm = boto3.client('acm', region_name='us-east-1')
dynamo_client = boto3.client('dynamodb', region_name='us-west-2')
route53 = boto3.client('route53')

certificate = {
    'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
    'DomainName': 'ssl2.keyi.solutions.aws.a2z.org.cn',
    'SubjectAlternativeNames': ['www.example.com', 'www.example.org'],
    'CertPem': '',
    'PrivateKeyPem': '',
    'ChainPem': ''
}

CertPem = """
-----BEGIN CERTIFICATE-----
MIIFSzCCBDOgAwIBAgISBMa27AM3wsSfquuIfLk9cIBOMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yMjAzMTYwNDAzMTVaFw0yMjA2MTQwNDAzMTRaMC0xKzApBgNVBAMT
InNzbDYua2V5aS5zb2x1dGlvbnMuYXdzLmEyei5vcmcuY24wggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC1J+ZEhGEO9XpQnc3r9/0gVWsOdFSvhbxEXUpF
1cPXHW4rDeIkjzHvNmMh9Ep0pIADJgIQALxwaxASfwemwCfNRzSWfgSWgWCr7zUD
OAce9FXn52gPHCnm7i7Ig3Y/Xz/HRlWWIqSttRFpU4FKW37BOtpx7XCW0myO0H+0
WJyxpzQEHHUBDi6cseLvg2PYBj35HxcYUSle9ORSKtoiagANGav+C3B+9Xh7i04u
yk2/2Di4jBD5BIpE3UNy/ciEoeo2M/5LWvPkO5baG8zfgILz+oKrcQKO620A+S4l
jDjZvT2ylogydbf2nKy/hb+0LB40eryGNmZcPeaug4jmKu/hAgMBAAGjggJeMIIC
WjAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMC
MAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFAixQHwTUkU3qpHpQ5HEJ7j2t/7aMB8G
A1UdIwQYMBaAFBQusxe3WFbLrlAJQOYfr52LFMLGMFUGCCsGAQUFBwEBBEkwRzAh
BggrBgEFBQcwAYYVaHR0cDovL3IzLm8ubGVuY3Iub3JnMCIGCCsGAQUFBzAChhZo
dHRwOi8vcjMuaS5sZW5jci5vcmcvMC0GA1UdEQQmMCSCInNzbDYua2V5aS5zb2x1
dGlvbnMuYXdzLmEyei5vcmcuY24wTAYDVR0gBEUwQzAIBgZngQwBAgEwNwYLKwYB
BAGC3xMBAQEwKDAmBggrBgEFBQcCARYaaHR0cDovL2Nwcy5sZXRzZW5jcnlwdC5v
cmcwggEFBgorBgEEAdZ5AgQCBIH2BIHzAPEAdwDfpV6raIJPH2yt7rhfTj5a6s2i
EqRqXo47EsAgRFwqcwAAAX+RG9p1AAAEAwBIMEYCIQCamPrj/Mi9iKXZKcZ241IC
pp5HQAVpJg25EbjSxsSOhQIhAMYx0b29hcMP0sLomtuZFUFO2oGxSxsvIDnVROLT
te07AHYAKXm+8J45OSHwVnOfY6V35b5XfZxgCvj5TV0mXCVdx4QAAAF/kRvajgAA
BAMARzBFAiEA0h3MQIw1+03o2E3Wu1MoI+JfDzJalDgpk3tE8yoz5FACIFBUSm+s
T7/hxpGagAGxatsfKchsa7qH+YZPW9YR3Fq9MA0GCSqGSIb3DQEBCwUAA4IBAQBU
Pz2Om/fkJZ4/wb6zGKG9jHkdzmhEbeI3YDcBUYO+KgFpMap7Foe3TE+mfZBFUSLp
Wpvb82lLD8YQfr95GuWRH6q6YuJiysVk+p7zi+7Fwq4P/FN9xPnOWE3Md1FPGE8x
e08ihGnarYZkIS45nmFM8aofhYfjCzaMa0t+qCEZDWVQdg0f9ieR6cdgyXNpCDFZ
t5yS29wEflRPXUPMLChDXSva7/TaIUfxgHuEF8B+PFFSh21MR3RTm/kt5lhjjEVE
9CJAxCcIh5yWfnwLzs81paoMP9h2ugZ8iiGdwIHem9P2N2OPWUFZy/T9mnggwaOP
q1ZE9mbT6Oex3vmKH3hc
-----END CERTIFICATE-----
"""

PrivateKeyPem = """
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1J+ZEhGEO9XpQ
nc3r9/0gVWsOdFSvhbxEXUpF1cPXHW4rDeIkjzHvNmMh9Ep0pIADJgIQALxwaxAS
fwemwCfNRzSWfgSWgWCr7zUDOAce9FXn52gPHCnm7i7Ig3Y/Xz/HRlWWIqSttRFp
U4FKW37BOtpx7XCW0myO0H+0WJyxpzQEHHUBDi6cseLvg2PYBj35HxcYUSle9ORS
KtoiagANGav+C3B+9Xh7i04uyk2/2Di4jBD5BIpE3UNy/ciEoeo2M/5LWvPkO5ba
G8zfgILz+oKrcQKO620A+S4ljDjZvT2ylogydbf2nKy/hb+0LB40eryGNmZcPeau
g4jmKu/hAgMBAAECggEAV36W277oNdZgJjGhdHfI/OXkmA2dnUzFWmuIZORS+0HO
pOLGt4ulvXiSNqMLlvygi2S/GEWSveUn1Rcfde1XC/F5N7pTsvF35HLbMtvLrKqs
Fx6QBsQ+hLfDRrsf0InLfw68ZZAD45YRe8KGLoi0VtV7Dg11FJM7NVsEYvFtdOuR
Hp5gzfqWkYWgcv/w/t0cwP3q6tpligephbn/8csbBMuPWsyqaBArNhj1UtYLktJa
j04xFFnn7RzI+qrImBxKf2uwMuSlap+eu5J28ZZ3PcgzYvX6BGPwVg9nGYClKrIh
UgLgep40iRQ79j8KR8vJAcWrvP2LegLt7Ik5iX+nlQKBgQDpt5HWNAj9mE+60qso
G5SrwkbeCusSYsOElp6kdyvBjfy4zehg4R1VEpHW00rhFxjbNOhrgaEWK28uwZxT
GIyZ1ChlHweT01om9evhTyfWNNnxtjiHODqBfQLy+rJ84kIA1nopvT5RDAq26SJr
r183kFiWQHhX9dZklKJR6AqeRwKBgQDGbXJBuYaXG3bSLQAvxqZB7UHdeibM4+dk
K2uu/oOCO1mCaxaKIZq+C3R8H2tY81U4HpPMp6wULdZtd8pD3JN2BoX8CFIL3uwu
yKex4ccz49ukOLOTp8dbg5Nj2WrjCzJiMxeqgrejrUiOVdNtdLWaFBYBd9G0oU/W
Bf2qsIHMlwKBgGUegl+eJeGqu5xGN71jqYBizwyUxr4usw8zp7Haybi1uQkwNYFt
BKbhIO5EftpChwOYsZKKBGs2IaWmKP+e2H5Z15xgv4OK5y+CKStTdxXryfwVbgG7
Jz0NHHCKXR1BO3NnWHWkpkikoCIhXj4fI2BD+MARZsAP4lGkKVKsxaNTAoGBAL20
ZUfw13wgBblqzILgqJLfAdl8rxuzx8U8vfbP3Wrk0u6c8y+ccRTAXt1MLJUeDptY
oHVI2HtyV07Q989pUpHEKtSKH+a5eZRAwhKOiKRTc+nNS+Iexbn4UTFk64ulaMX5
kuaxkmApivSJmVlL+1MTYPaGVzcaAfncQGiv12iBAoGAHScAag4hy/ds3XDxx9d8
7SzbOLNdJeAmd37torUphrKNRIggmufb6deidoR5zxA18r1PBCIvb8POuy0aZEfL
Gs7TMBiyKwO9sGepkJqqu1wT6F7AuhFhmSr4tW3ZTMthhIKGRzX8UhZhBmr44xO1
w6edw6r0I6hw8Lgs6u3XfKE=
-----END PRIVATE KEY-----
"""

ChainPem = """
-----BEGIN CERTIFICATE-----
MIIFFjCCAv6gAwIBAgIRAJErCErPDBinU/bWLiWnX1owDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjAwOTA0MDAwMDAw
WhcNMjUwOTE1MTYwMDAwWjAyMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg
RW5jcnlwdDELMAkGA1UEAxMCUjMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQC7AhUozPaglNMPEuyNVZLD+ILxmaZ6QoinXSaqtSu5xUyxr45r+XXIo9cP
R5QUVTVXjJ6oojkZ9YI8QqlObvU7wy7bjcCwXPNZOOftz2nwWgsbvsCUJCWH+jdx
sxPnHKzhm+/b5DtFUkWWqcFTzjTIUu61ru2P3mBw4qVUq7ZtDpelQDRrK9O8Zutm
NHz6a4uPVymZ+DAXXbpyb/uBxa3Shlg9F8fnCbvxK/eG3MHacV3URuPMrSXBiLxg
Z3Vms/EY96Jc5lP/Ooi2R6X/ExjqmAl3P51T+c8B5fWmcBcUr2Ok/5mzk53cU6cG
/kiFHaFpriV1uxPMUgP17VGhi9sVAgMBAAGjggEIMIIBBDAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMBIGA1UdEwEB/wQIMAYB
Af8CAQAwHQYDVR0OBBYEFBQusxe3WFbLrlAJQOYfr52LFMLGMB8GA1UdIwQYMBaA
FHm0WeZ7tuXkAXOACIjIGlj26ZtuMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcw
AoYWaHR0cDovL3gxLmkubGVuY3Iub3JnLzAnBgNVHR8EIDAeMBygGqAYhhZodHRw
Oi8veDEuYy5sZW5jci5vcmcvMCIGA1UdIAQbMBkwCAYGZ4EMAQIBMA0GCysGAQQB
gt8TAQEBMA0GCSqGSIb3DQEBCwUAA4ICAQCFyk5HPqP3hUSFvNVneLKYY611TR6W
PTNlclQtgaDqw+34IL9fzLdwALduO/ZelN7kIJ+m74uyA+eitRY8kc607TkC53wl
ikfmZW4/RvTZ8M6UK+5UzhK8jCdLuMGYL6KvzXGRSgi3yLgjewQtCPkIVz6D2QQz
CkcheAmCJ8MqyJu5zlzyZMjAvnnAT45tRAxekrsu94sQ4egdRCnbWSDtY7kh+BIm
lJNXoB1lBMEKIq4QDUOXoRgffuDghje1WrG9ML+Hbisq/yFOGwXD9RiX8F6sw6W4
avAuvDszue5L3sz85K+EC4Y/wFVDNvZo4TYXao6Z0f+lQKc0t8DQYzk1OXVu8rp2
yJMC6alLbBfODALZvYH7n7do1AZls4I9d1P4jnkDrQoxB3UqQ9hVl3LEKQ73xF1O
yK5GhDDX8oVfGKF5u+decIsH4YaTw7mP3GFxJSqv3+0lUFJoi5Lc5da149p90Ids
hCExroL1+7mryIkXPeFM5TgO9r0rvZaBFOvV2z0gp35Z0+L4WPlbuEjN/lxPFin+
HlUjr8gRsI3qfJOQFy/9rKIJR0Y/8Omwt/8oTWgy1mdeHmmjk7j1nYsvC9JSQ6Zv
MldlTTKB3zhThV1+XWYp6rjd5JW1zbVWEkLNxE7GJThEUG3szgBVGP7pSWTUTsqX
nLRbwHOoq7hHwg==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/
MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT
DkRTVCBSb290IENBIFgzMB4XDTIxMDEyMDE5MTQwM1oXDTI0MDkzMDE4MTQwM1ow
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwggIiMA0GCSqGSIb3DQEB
AQUAA4ICDwAwggIKAoICAQCt6CRz9BQ385ueK1coHIe+3LffOJCMbjzmV6B493XC
ov71am72AE8o295ohmxEk7axY/0UEmu/H9LqMZshftEzPLpI9d1537O4/xLxIZpL
wYqGcWlKZmZsj348cL+tKSIG8+TA5oCu4kuPt5l+lAOf00eXfJlII1PoOK5PCm+D
LtFJV4yAdLbaL9A4jXsDcCEbdfIwPPqPrt3aY6vrFk/CjhFLfs8L6P+1dy70sntK
4EwSJQxwjQMpoOFTJOwT2e4ZvxCzSow/iaNhUd6shweU9GNx7C7ib1uYgeGJXDR5
bHbvO5BieebbpJovJsXQEOEO3tkQjhb7t/eo98flAgeYjzYIlefiN5YNNnWe+w5y
sR2bvAP5SQXYgd0FtCrWQemsAXaVCg/Y39W9Eh81LygXbNKYwagJZHduRze6zqxZ
Xmidf3LWicUGQSk+WT7dJvUkyRGnWqNMQB9GoZm1pzpRboY7nn1ypxIFeFntPlF4
FQsDj43QLwWyPntKHEtzBRL8xurgUBN8Q5N0s8p0544fAQjQMNRbcTa0B7rBMDBc
SLeCO5imfWCKoqMpgsy6vYMEG6KDA0Gh1gXxG8K28Kh8hjtGqEgqiNx2mna/H2ql
PRmP6zjzZN7IKw0KKP/32+IVQtQi0Cdd4Xn+GOdwiK1O5tmLOsbdJ1Fu/7xk9TND
TwIDAQABo4IBRjCCAUIwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYw
SwYIKwYBBQUHAQEEPzA9MDsGCCsGAQUFBzAChi9odHRwOi8vYXBwcy5pZGVudHJ1
c3QuY29tL3Jvb3RzL2RzdHJvb3RjYXgzLnA3YzAfBgNVHSMEGDAWgBTEp7Gkeyxx
+tvhS5B1/8QVYIWJEDBUBgNVHSAETTBLMAgGBmeBDAECATA/BgsrBgEEAYLfEwEB
ATAwMC4GCCsGAQUFBwIBFiJodHRwOi8vY3BzLnJvb3QteDEubGV0c2VuY3J5cHQu
b3JnMDwGA1UdHwQ1MDMwMaAvoC2GK2h0dHA6Ly9jcmwuaWRlbnRydXN0LmNvbS9E
U1RST09UQ0FYM0NSTC5jcmwwHQYDVR0OBBYEFHm0WeZ7tuXkAXOACIjIGlj26Ztu
MA0GCSqGSIb3DQEBCwUAA4IBAQAKcwBslm7/DlLQrt2M51oGrS+o44+/yQoDFVDC
5WxCu2+b9LRPwkSICHXM6webFGJueN7sJ7o5XPWioW5WlHAQU7G75K/QosMrAdSW
9MUgNTP52GE24HGNtLi1qoJFlcDyqSMo59ahy2cI2qBDLKobkx/J3vWraV0T9VuG
WCLKTVXkcGdtwlfFRjlBz4pYg1htmf5X6DYO8A4jqv2Il9DjXA6USbW1FzXSLr9O
he8Y4IWS6wY7bCkjCWDcRQJMEhg76fsO3txE+FiYruq9RUWhiF1myv4Q6W+CyBFC
Dfvp7OOGAN6dEOM4+qR9sdjoSYKEBpsr6GtPAQw4dy753ec5
-----END CERTIFICATE-----
"""

FILE_FOLDER = os.path.join(os.path.dirname(__file__), "certs")
PEM_FILE = FILE_FOLDER + "/cert.pem"

def convert_string_to_file(string, file_name):
    """[summary]
    Args:
        string ([type]): [description]
        file_name ([type]): [description]
    
    Returns:
        [type]: [description]
    """
    print('Converting string to file %s', file_name)
    with open(file_name, 'wb') as f:
        f.write(string.encode('utf-8'))

def isValidDomain(str):
    """_summary_

    Args:
        str (_type_): _description_

    Returns:
        _type_: _description_
    """
    if (str == None) or str.count('.') < 2:
        return False

    # accept domain format:
    # 1.mydomain.com
    # 1.2.mydomain.com
    # www.domain.com
    # *.domain.com

    # deny domain format:
    # www.mydom-ain-.com.uk
    # bad_domain.com
    # bad:domain.com
    # http://only.domains.com
    regex = r"^(\*\.)*(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$"
    p = re.compile(regex)
 
    if(re.search(p, str)):
        return True
    else:
        return False

def get_domain_list_from_cert():
    """[summary]
    Validate cerfiticate created by certbot with command below:
    Args:
        certificate ([type]): refer to https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html#alternate-domain-names-requirements for certificate requirement

    Returns:
        [type]: [description]
    """
    domainList = []
    # decrypt pem info using 1) https://cryptography.io/en/latest/; 2) openssl (https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/tools/print_certificates.py); 3) openssl (https://www.sslshopper.com/article-most-common-openssl-commands.html)
    try:
        print('openssl x509 -text -noout -in ', str(PEM_FILE))
        resp = subprocess.check_output(['openssl', 'x509', '-text', '-noout', '-in', str(PEM_FILE)], stderr=subprocess.PIPE, encoding='utf-8')
        # filter strings like 'DNS:*.ssl2.keyi.solutions.aws.a2z.org.cn, DNS:ssl3.keyi.solutions.aws.a2z.org.cn' in response
        resp = resp.split('\n')
        resp = [x for x in resp if 'DNS:' in x]
        resp = resp[0].split(',')
        # resp = ['DNS:*.ssl2.keyi.solutions.aws.a2z.org.cn, DNS:ssl3.keyi.solutions.aws.a2z.org.cn']

        # iterate all DNS names
        for x in resp:
            # remove 'DNS:'
            x = x.replace('DNS:', '').strip()
            print('domain name ', x)
            domainList.append(x)
            # check if DNS name is valid and return domain list if valid
            # if isValidDomain(x):
            #     domainList.append(x)
            # else:
            #     print('invalid domain name', x)
    except Exception as e:
        print('error validating certificate: ', e)
    return domainList

# mock event json for certificate import
event = {
    "CertPem": CertPem,
    "PrivateKeyPem": PrivateKeyPem,
    "ChainPem": ChainPem
}

context = {
    "aws_request_id": "f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8",
    "invoked_function_arn": "arn:aws:lambda:us-east-1:123456789012:function:acm_import_cb",
    "log_group_name": "/aws/lambda/acm_import_cb",
    "log_stream_name": "2018/09/12/[$LATEST]f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8",
    "function_name": "acm_import_cb",
    "memory_limit_in_mb": "128",
    "function_version": "$LATEST",
    "identity": {
        "cognito_identity_id": "123456789012",
        "cognito_identity_pool_id": "us-east-1:123456789012",
        "principal_org_id": "123456789012",
        "principal_org_name": "123456789012",
        "principal_user_id": "123456789012",
        "principal_user_name": "123456789012",
        "user": "arn:aws:iam::123456789012:user/123456789012",
        "user_agent": "aws-cli/1.2.6 Python/2.7.12 Windows/7",
        "user_arn": "arn:aws:iam::123456789012:user/123456789012"
    }
}
def import_certificate(certificate):
    """[summary]
    Import cerfiticate created by certbot with command below:
    sudo certbot certonly --manual --preferred-challenges dns -d "*.apex.keyi.solutions.aws.a2z.org.cn"
    
    And upload to ACM with commands below:
    sudo aws acm import-certificate --certificate fileb:///etc/letsencrypt/live/ssl1.keyi.solutions.aws.a2z.org.cn/cert.pem --certificate-chain fileb:///etc/letsencrypt/live/ssl1.keyi.solutions.aws.a2z.org.cn/chain.pem --private-key fileb:///etc/letsencrypt/live/ssl1.keyi.solutions.aws.a2z.org.cn/privkey.pem --region us-east-1

    Args:
        certificate ([type]): refer to https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html#alternate-domain-names-requirements for certificate requirement

    Returns:
        [type]: [description]
    """
    print('importing existing cerfification')
    try:
        resp = acm.import_certificate(
            Certificate=certificate['CertPem'],
            PrivateKey=certificate['PrivateKeyPem'],
            CertificateChain=certificate['ChainPem'],
            # CertificateArn=certificate['CertificateArn'],
            Tags=[
                {
                    'Key': 'issuer',
                    'Value': certificate['DomainName']
                }
            ]
        )
    except Exception as e:
        print('error importing certificate: %s', e)
        return None
    
    print('certificate imported: %s', json.dumps(resp))
    return resp['CertificateArn']

def isValidDomain(str):
    """_summary_

    Args:
        str (_type_): _description_

    Returns:
        _type_: _description_
    """
    if (str == None) or str.count('.') < 2:
        return False

    # accept domain format:
    # 1.mydomain.com
    # 1.2.mydomain.com
    # www.domain.com
    # *.domain.com

    # deny domain format:
    # www.mydom-ain-.com.uk
    # bad_domain.com
    # bad:domain.com
    # http://only.domains.com
    regex = "^(?:\*\.)*(?:_?(?>[a-z\d][a-z\d-]{0,61}[a-z\d]|[a-z\d])\.)*(?:_?(?>[a-z\d][a-z\d-]{0,61}[a-z\d]|[a-z\d]))\.?$"
    # regex = r"^(?=.{1,255}$)(?!-)[A-Za-z0-9\-]{1,63}(\.[A-Za-z0-9\-]{1,63})*\.?(?<!-)$"
    # p = re.compile(regex)
 
    if(re.match(regex, str)):
        return True
    else:
        return False

def lambda_handler(event, context):

    certificate['CertPem'] = str.encode(event['CertPem'])
    certificate['PrivateKeyPem'] = str.encode(event['PrivateKeyPem'])
    certificate['ChainPem'] = str.encode(event['ChainPem'])
    # print('certificate: %s', certificate)

    # convert_string_to_file(event['CertPem'], PEM_FILE)
    domainList = get_domain_list_from_cert()
    print('domain list: ', domainList)
    # # import_certificate(certificate)

def add_cname_record(cnameName, cnameValue):
    response = route53.change_resource_record_sets(
        ChangeBatch={
            'Changes': [
                {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        # 'HealthCheckId': 'abcdef11-2222-3333-4444-555555fedcba',
                        'Name': cnameName,
                        'ResourceRecords': [
                            {
                                'Value': cnameValue,
                            },
                        ],
                        'SetIdentifier': 'SaaS For SSL',
                        'TTL': 300,
                        'Type': 'CNAME',
                        'Weight': 100,
                    },
                }
            ],
            'Comment': 'add cname record for certificate',
        },
        HostedZoneId='Z06047132H4EXEIT5C57E',
    )

def demo():
    
    response = dynamo_client.scan(
        TableName='acm_metadata_store',
        FilterExpression='domainName = :domain_name AND taskStatus = :status',
        ExpressionAttributeValues={
            ':domain_name': {
                'S': 'cdn4.risetron.cn'
            },
            ':status': {
                'S': 'CERT_ISSUED'
            }
        },
    ) 
    print(response)

if __name__ == '__main__':
    cnameList = ['<Paste CNAME List Here>']
    for i, val in enumerate(cnameList):
        add_cname_record(val['Name'], val['Value'])