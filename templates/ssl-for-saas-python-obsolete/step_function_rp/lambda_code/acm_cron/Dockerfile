# Authenticate to a public registry: aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
# Authenticate to your own ECR: aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin xxxx.dkr.ecr.us-west-2.amazonaws.com
FROM public.ecr.aws/lambda/python:3.8

COPY *.py ${LAMBDA_TASK_ROOT}

# COPY requirements.txt  .
# RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
#

CMD ["acm_cron.lambda_handler"]