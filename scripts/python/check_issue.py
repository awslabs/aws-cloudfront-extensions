import sys
import logging
from optparse import OptionParser

log = logging.getLogger('aws-cloudfront-extension.check_issue')
log_formatter = logging.Formatter(
  '[%(asctime)s %(name)s][%(levelname)s] %(message)s')
log_stream_handler = logging.StreamHandler(sys.stdout)
log_stream_handler.setFormatter(log_formatter)
log.addHandler(log_stream_handler)
log.setLevel(logging.INFO)

REPRO_STEP = "### Reproduction Steps"
EXPECTED_RESULT = "### What did you expect to happen?"
ACTUAL_RESULT = "### What actually happened?"


def parse_opt():
  parser = OptionParser(
      usage="Usage: python check_issue.py [options]\n\t Check compliance for the content")
  parser.add_option("-b", "--body",
                    dest="body",
                    help="The issue content body")
  option, args = parser.parse_args()
  return parser, option, args


def check_issue():
  parser, option, args = parse_opt()

  if not option.body:
    log.error('Missing arguments: -b or --body')
    parser.print_help()
    sys.exit(1)

  issue_content = option.body
  log.info('Issue content: ' + issue_content)
  index_repro = issue_content.find(REPRO_STEP)
  index_expected = issue_content.find(EXPECTED_RESULT)
  index_actual = issue_content.find(ACTUAL_RESULT)

  if index_repro == -1 or index_expected == -1 or index_actual == -1:
    log.error('Please fill in the information by using the template')
    sys.exit(1)

  repro_content = issue_content[index_repro + len(REPRO_STEP), index_expected]
  expected_content = issue_content[
    index_expected + len(EXPECTED_RESULT), index_actual]

  log.info('Reproduce steps: ' + repro_content)
  log.info('Expected result: ' + expected_content)
  if len(repro_content.strip()) == 0 or len(expected_content.strip()) == 0:
    log.error(
      'Empty reproduce steps or expected result, please fill in these fields')
    sys.exit(1)


if __name__ == '__main__':
  check_issue()
