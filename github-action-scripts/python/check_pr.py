import logging
import sys
from optparse import OptionParser

log = logging.getLogger('aws-cloudfront-extension.check_pr')
log_formatter = logging.Formatter(
    '[%(asctime)s %(name)s][%(levelname)s] %(message)s')
log_stream_handler = logging.StreamHandler(sys.stdout)
log_stream_handler.setFormatter(log_formatter)
log.addHandler(log_stream_handler)
log.setLevel(logging.INFO)

DESC = "*Description of changes:*"
TESTING = "*How Has This Been Tested:*"
CHECKBOX = "*[x] My testing has passed*"


def parse_opt():
    parser = OptionParser(
        usage="Usage: python check_pr.py [options]\n\t Check compliance for PR content")
    parser.add_option("-b", "--body",
                      dest="body",
                      help="The PR content body")
    option, args = parser.parse_args()
    return parser, option, args


def check_pr():
    parser, option, args = parse_opt()

    if not option.body:
        log.error('Missing arguments: -b or --body')
        parser.print_help()
        sys.exit(1)

    pr_content = get_pr_from_file(option.body)
    log.info('PR content: ' + pr_content)
    index_desc = pr_content.find(DESC)
    index_testing = pr_content.find(TESTING)
    index_checkbox = pr_content.find(CHECKBOX)

    if index_desc == -1 or index_testing == -1 or index_checkbox == -1:
        log.error('Please fill in the information by using the template')
        sys.exit(1)

    desc_content = pr_content[index_desc + len(DESC): index_testing]
    testing_content = pr_content[
                      index_testing + len(TESTING): index_checkbox]

    log.info('PR description: ' + desc_content)
    log.info('Test evidence: ' + testing_content)
    if len(desc_content.strip()) == 0 or len(testing_content.strip()) == 0:
        log.error(
            'Empty PR description or test evidence, please fill in these fields')
        sys.exit(1)

    log.info('Check PR compliance succeed')


def get_pr_from_file(file_name):
    f = open(file_name, "r")
    process_lines = f.readlines()
    file_content = ''
    for line in process_lines:
        file_content += line

    f.close()
    return file_content


if __name__ == '__main__':
    check_pr()
