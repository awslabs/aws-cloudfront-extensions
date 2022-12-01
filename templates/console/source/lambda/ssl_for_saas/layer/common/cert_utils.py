import subprocess
from layer.common.domain_utils import is_valid_domain


# get domain name from certificate
def get_domain_list_from_cert(pem_file_path: str, logger):
    domain_list = []
    # decrypt pem info using 1) https://cryptography.io/en/latest/; 2) openssl (https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/tools/logger.info_certificates.py); 3) openssl (https://www.sslshopper.com/article-most-common-openssl-commands.html)
    try:
        resp = subprocess.check_output(['openssl', 'x509', '-text', '-noout', '-in', str(pem_file_path)], stderr=subprocess.PIPE, encoding='utf-8')
        logger.info('openssl x509 -text -noout -in %s: %s', pem_file_path, resp)
        # filter strings like 'DNS:*.ssl2.keyi.solutions.aws.a2z.org.cn,
        # DNS:ssl3.keyi.solutions.aws.a2z.org.cn' in response
        resp = resp.split('\n')
        resp = [x for x in resp if 'DNS:' in x]
        resp = resp[0].split(',')
        # resp = ['DNS:*.ssl2.keyi.solutions.aws.a2z.org.cn, DNS:ssl3.keyi.solutions.aws.a2z.org.cn']

        # iterate all DNS names
        for x in resp:
            # remove 'DNS:'
            x = x.replace('DNS:', '').strip()
            logger.info('domain name %s', x)
            # check if DNS name is valid and return domain list if valid
            if is_valid_domain(x):
                domain_list.append(x)
            else:
                logger.error('invalid domain name %s', x)
    except Exception as e:
        logger.error('error validating certificate: %s', e)
    return domain_list
